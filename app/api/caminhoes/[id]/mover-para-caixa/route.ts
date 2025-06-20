export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { registrarLog } from "@/lib/log-usuario";

// PATCH → Mover caminhão manualmente para uma caixa (fila ou ocupação)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caminhaoId = parseInt(params.id);
  if (isNaN(caminhaoId)) {
    return NextResponse.json({ error: "ID de caminhão inválido." }, { status: 400 });
  }

  try {
    const { caixaId } = await req.json();

    if (!caixaId || isNaN(parseInt(caixaId))) {
      return NextResponse.json({ error: "ID da caixa não informado ou inválido." }, { status: 400 });
    }

    const caixa = await prisma.caixa.findUnique({
      where: { id: parseInt(caixaId) },
    });

    if (!caixa) {
      return NextResponse.json({ error: "Caixa não encontrada." }, { status: 404 });
    }

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
    });

    if (!caminhao) {
      return NextResponse.json({ error: "Caminhão não encontrado." }, { status: 404 });
    }

    if (caixa.status === "livre") {
      // Caminhão entra diretamente na caixa
      await prisma.$transaction([
        prisma.caminhao.update({
          where: { id: caminhaoId },
          data: {
            caixaId: caixa.id,
            destinoCaixaId: null,
            manual: true, // Marca como manual
          },
        }),
        prisma.caixa.update({
          where: { id: caixa.id },
          data: { status: "ocupada" },
        }),
      ]);

      await registrarLog(
        `Moveu caminhão ${caminhao.placa} diretamente para a caixa ${caixa.nome}`,
        caminhao.origem === "estacionamento" ? "Estacionamento" : "Sistema"
      );

      return NextResponse.json({
        message: `Caminhão ${caminhao.placa} movido diretamente para a caixa ${caixa.nome}.`,
        manual: true,
      });
    } else {
      // Caminhão vai para a fila (destinoCaixa)
      await prisma.caminhao.update({
        where: { id: caminhaoId },
        data: {
          destinoCaixaId: caixa.id,
          manual: true, // Marca como manual mesmo na fila
        },
      });

      await registrarLog(
        `Encaminhou caminhão ${caminhao.placa} para a fila da caixa ${caixa.nome}`,
        caminhao.origem === "estacionamento" ? "Estacionamento" : "Sistema"
      );

      return NextResponse.json({
        message: `Caminhão ${caminhao.placa} encaminhado para a fila da caixa ${caixa.nome}.`,
        manual: true,
      });
    }
  } catch (error) {
    console.error("Erro ao mover caminhão para caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao mover caminhão para caixa." },
      { status: 500 }
    );
  }
}