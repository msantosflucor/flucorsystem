export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params?: { id?: string } }
) {
  const id = context.params?.id;

  if (!id || isNaN(Number(id))) {
    return NextResponse.json(
      { error: "ID da caixa inválido." },
      { status: 400 }
    );
  }

  const caixaId = Number(id);

  try {
    const { confirmar } = await request.json().catch(() => ({ confirmar: null }));

    // ✅ Finaliza o caminhão atual vinculado à caixa
    const caminhaoAtual = await prisma.caminhao.findFirst({
      where: { caixaId },
    });

    if (caminhaoAtual) {
      // Atualiza status e remove da caixa
      await prisma.caminhao.update({
        where: { id: caminhaoAtual.id },
        data: {
          status: "finalizado",
          caixaId: null,
        },
      });

      // Cria entrada no histórico (analise)
      await prisma.analise.create({
        data: {
          caminhaoId: caminhaoAtual.id,
          status: "finalizado",
          tanque: "N/D",
          observacoes: "Encerrado automaticamente ao liberar a caixa.",
        },
      });
    }

    // Busca próximo caminhão com destino à caixa
    const proximo = await prisma.caminhao.findFirst({
      where: {
        status: "in_progress",
        destinoCaixaId: caixaId,
      },
      orderBy: { criadoEm: "asc" },
    });

    if (proximo) {
      if (confirmar === true) {
        await prisma.caminhao.update({
          where: { id: proximo.id },
          data: {
            status: "waiting",
            caixaId,
            destinoCaixaId: null,
          },
        });

        await prisma.caixa.update({
          where: { id: caixaId },
          data: { status: "ocupada" },
        });

        return NextResponse.json({
          message: `Caminhão ${proximo.placa} movido automaticamente para a caixa.`,
          proximo: null,
        });
      }

      if (confirmar === false) {
        await prisma.caixa.update({
          where: { id: caixaId },
          data: { status: "livre" },
        });

        return NextResponse.json({
          message: `Caixa liberada. Próximo caminhão disponível: ${proximo.placa}`,
          proximo: {
            id: proximo.id,
            placa: proximo.placa,
            origem: proximo.origem,
          },
        });
      }

      return NextResponse.json({
        message: `Caminhão finalizado. Há um próximo na fila.`,
        proximo: {
          id: proximo.id,
          placa: proximo.placa,
          origem: proximo.origem,
        },
      });
    }

    // Nenhum próximo caminhão → liberar a caixa
    await prisma.caixa.update({
      where: { id: caixaId },
      data: { status: "livre" },
    });

    return NextResponse.json({
      message: `Caminhão finalizado e caixa liberada. Nenhum próximo na fila.`,
      proximo: null,
    });
  } catch (error) {
    console.error("Erro ao liberar a caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao liberar a caixa." },
      { status: 500 }
    );
  }
}