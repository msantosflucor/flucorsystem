import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: { id: string };
}

// 🔍 GET - Obter análise por ID
export async function GET(req: Request, { params }: Params) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID da análise inválido." },
      { status: 400 }
    );
  }

  try {
    const analise = await prisma.analise.findUnique({
      where: { id },
      include: {
        caminhao: {
          include: {
            caixa: true,
          },
        },
      },
    });

    if (!analise) {
      return NextResponse.json(
        { error: "Análise não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(analise);
  } catch (error) {
    console.error("Erro ao buscar análise:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar análise." },
      { status: 500 }
    );
  }
}

// ✏️ PATCH - Atualizar análise por ID
export async function PATCH(req: Request, { params }: Params) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID da análise inválido ou ausente." },
      { status: 400 }
    );
  }

  const body = await req.json();

  const {
    status,
    observacoes,
    ph,
    condutividade,
    cor,
    odor,
    outroParametro, // pode incluir qualquer campo que esteja no seu modelo Analise
  } = body;

  try {
    const analiseAtualizada = await prisma.analise.update({
      where: { id },
      data: {
        status,
        observacoes,
        ph,
        condutividade,
        cor,
        odor,
        outroParametro,
      },
    });

    return NextResponse.json(analiseAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar análise:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar análise." },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE - Remover análise
export async function DELETE(req: Request, { params }: Params) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID da análise inválido." },
      { status: 400 }
    );
  }

  try {
    await prisma.analise.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Análise deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar análise:", error);
    return NextResponse.json(
      { error: "Erro interno ao deletar análise." },
      { status: 500 }
    );
  }
}