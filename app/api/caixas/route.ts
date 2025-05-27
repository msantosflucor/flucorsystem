import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { StatusCaixa, StatusCaminhao } from "@prisma/client";

// ✅ GET - Listar todas as caixas com informações da linha e do caminhão atual (se houver)
export async function GET() {
  try {
    const caixas = await prisma.caixa.findMany({
      orderBy: { nome: "asc" },
      include: {
        linha: true,
        caminhoes: {
          where: {
            status: {
              in: [StatusCaminhao.waiting, StatusCaminhao.in_progress],
            },
          },
          orderBy: { criadoEm: "desc" },
          take: 1,
        },
      },
    });

    const resultado = caixas.map((c) => ({
      id: c.id,
      nome: c.nome,
      status: c.status,
      tipoResiduo: c.tipoResiduo,
      linha: c.linha ? { id: c.linha.id, nome: c.linha.nome } : null,
      criadoEm: c.criadoEm,
      caminhaoId: c.caminhoes[0]?.id || null,
      caminhaoPlaca: c.caminhoes[0]?.placa || null,
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar caixas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caixas." },
      { status: 500 }
    );
  }
}

// ✅ PATCH - Liberar uma caixa e marcar o caminhão como finalizado
export async function PATCH(req: Request) {
  try {
    const { caixaId, caminhaoId } = await req.json();

    if (!caixaId || !caminhaoId) {
      return NextResponse.json(
        { error: "caixaId e caminhaoId são obrigatórios." },
        { status: 400 }
      );
    }

    // 🔧 Libera a caixa (status = livre)
    await prisma.caixa.update({
      where: { id: caixaId },
      data: { status: StatusCaixa.livre },
    });

    // 🔧 Atualiza o caminhão para 'finalizado' → Isso envia ele pro histórico
    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: { status: StatusCaminhao.finalizado },
    });

    return NextResponse.json({
      message: "Caixa liberada e caminhão finalizado.",
    });
  } catch (error) {
    console.error("Erro ao liberar caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao liberar caixa." },
      { status: 500 }
    );
  }
}