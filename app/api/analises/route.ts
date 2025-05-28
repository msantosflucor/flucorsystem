import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ✅ POST - Registrar uma nova análise (laboratorial)
export async function POST(req: Request) {
  try {
    const { caminhaoId, status, tanque, observacoes } = await req.json();

    if (!caminhaoId || !status || !tanque) {
      return NextResponse.json(
        { error: "Dados obrigatórios faltando (caminhaoId, status, tanque)." },
        { status: 400 }
      );
    }

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
    });

    if (!caminhao) {
      return NextResponse.json(
        { error: "Caminhão não encontrado." },
        { status: 404 }
      );
    }

    // 🔧 Atualizar apenas o status do caminhão (approved, rejected, incompatible, etc.)
    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: { status },
    });

    return NextResponse.json(
      { message: "Análise registrada e status do caminhão atualizado." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registrar análise:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar análise." },
      { status: 500 }
    );
  }
}

// ✅ GET - Listar todas as análises (histórico de liberações)
export async function GET() {
  try {
    const analises = await prisma.analise.findMany({
      include: {
        caminhao: {
          include: {
            caixa: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    const resultado = analises.map((a) => ({
      id: a.id,
      status: a.status,
      tanque: a.tanque,
      observacoes: a.observacoes,
      criadoEm: a.criadoEm,
      caminhao: {
        id: a.caminhao.id,
        placa: a.caminhao.placa,
        origem: a.caminhao.origem,
        tipo: a.caminhao.tipo,
        caixa: a.caminhao.caixa
          ? {
              id: a.caminhao.caixa.id,
              nome: a.caminhao.caixa.nome,
              tipoResiduo: a.caminhao.caixa.tipoResiduo,
            }
          : null,
      },
    }));

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar análises:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar análises." },
      { status: 500 }
    );
  }
}