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
              not: "finalizado", // 🔥 Só oculta caminhões finalizados
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
      caminhaoId: c.caminhoes.length > 0 ? c.caminhoes[0].id : null,
      caminhaoPlaca: c.caminhoes.length > 0 ? c.caminhoes[0].placa : null,
      caminhaoStatus: c.caminhoes.length > 0 ? c.caminhoes[0].status : null,
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

// ✅ PATCH - Liberar caixa, atualizar caminhão e registrar no histórico
export async function PATCH(req: Request) {
  try {
    const { caixaId, caminhaoId, tanque = "Sem tanque", observacoes = "Sem observações" } = await req.json();

    if (!caixaId || !caminhaoId) {
      return NextResponse.json(
        { error: "caixaId e caminhaoId são obrigatórios." },
        { status: 400 }
      );
    }

    const caixa = await prisma.caixa.findUnique({
      where: { id: caixaId },
    });

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
    });

    if (!caixa) {
      return NextResponse.json(
        { error: "Caixa não encontrada." },
        { status: 404 }
      );
    }

    if (!caminhao) {
      return NextResponse.json(
        { error: "Caminhão não encontrado." },
        { status: 404 }
      );
    }

    // 🔧 Liberar a caixa
    await prisma.caixa.update({
      where: { id: caixaId },
      data: { status: StatusCaixa.livre },
    });

    // 🔧 Atualizar status do caminhão para finalizado
    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: { status: StatusCaminhao.finalizado },
    });

    // ✅ Criar registro no histórico (Analise)
    await prisma.analise.create({
      data: {
        caminhaoId: caminhao.id,
        status: StatusCaminhao.finalizado,
        tanque,
        observacoes,
      },
    });

    return NextResponse.json({
      message: "Caixa liberada, caminhão finalizado e registrado no histórico.",
    });
  } catch (error) {
    console.error("Erro ao liberar caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao liberar caixa." },
      { status: 500 }
    );
  }
}