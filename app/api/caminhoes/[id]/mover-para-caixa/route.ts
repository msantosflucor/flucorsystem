export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { registrarLogComUsuario } from "@/lib/log-usuario-ext";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

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

    const token = cookies().get("token")?.value;
    let autor = "Desconhecido";
    let usuarioId = null;

    if (token) {
      const { payload }: any = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      autor = payload.username || "Sem nome";
      usuarioId = payload.id;
    }

    const caixa = await prisma.caixa.findUnique({
      where: { id: parseInt(caixaId) },
      include: { linha: true },
    });

    if (!caixa) {
      return NextResponse.json({ error: "Caixa não encontrada." }, { status: 404 });
    }

    if (caixa.linha?.emManutencao) {
      return NextResponse.json(
        { error: "A linha associada a esta caixa está em manutenção." },
        { status: 403 }
      );
    }

    const caminhao = await prisma.caminhao.findUnique({ where: { id: caminhaoId } });
    if (!caminhao) {
      return NextResponse.json({ error: "Caminhão não encontrado." }, { status: 404 });
    }

    if (caixa.status === "livre") {
      await prisma.$transaction([
        prisma.caminhao.update({
          where: { id: caminhaoId },
          data: { caixaId: caixa.id, destinoCaixaId: null, manual: true },
        }),
        prisma.caixa.update({
          where: { id: caixa.id },
          data: { status: "ocupada" },
        }),
      ]);

      await registrarLogComUsuario({
        acao: "Movimentar caminhão para caixa",
        contexto: "Estacionamento de Caminhões",
        detalhes: `Moveu caminhão ${caminhao.placa} diretamente para a caixa ${caixa.nome}`,
      });

      return NextResponse.json({
        message: `Caminhão ${caminhao.placa} movido diretamente para a caixa ${caixa.nome}.`,
        manual: true,
      });
    } else {
      await prisma.caminhao.update({
        where: { id: caminhaoId },
        data: { destinoCaixaId: caixa.id, manual: true },
      });

      await registrarLogComUsuario({
        acao: "Encaminhar caminhão para fila",
        contexto: "Estacionamento de Caminhões",
        detalhes: `Encaminhou caminhão ${caminhao.placa} para a fila da caixa ${caixa.nome}`,
      });

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