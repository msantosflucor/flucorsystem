import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: { id: string };
}

// 🔍 GET - Obter dados da caixa por ID
export async function GET(req: Request, { params }: Params) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID da caixa inválido." },
      { status: 400 }
    );
  }

  try {
    const caixa = await prisma.caixa.findUnique({
      where: { id },
      include: {
        linha: true,
        caminhoes: {
          where: {
            status: {
              in: ["waiting", "in_progress"],
            },
          },
          orderBy: { criadoEm: "desc" },
          take: 1,
        },
      },
    });

    if (!caixa) {
      return NextResponse.json(
        { error: "Caixa não encontrada." },
        { status: 404 }
      );
    }

    const resultado = {
      id: caixa.id,
      nome: caixa.nome,
      status: caixa.status,
      tipoResiduo: caixa.tipoResiduo,
      linha: caixa.linha ? { id: caixa.linha.id, nome: caixa.linha.nome } : null,
      criadoEm: caixa.criadoEm,
      caminhaoId: caixa.caminhoes[0]?.id || null,
      caminhaoPlaca: caixa.caminhoes[0]?.placa || null,
    };

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caixa." },
      { status: 500 }
    );
  }
}

// ✏️ PATCH - Atualizar caixa
export async function PATCH(req: Request, { params }: Params) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID da caixa inválido ou ausente." },
      { status: 400 }
    );
  }

  const { status, nome, tipoResiduo, linhaId } = await req.json();

  try {
    const caixaAtualizada = await prisma.caixa.update({
      where: { id },
      data: {
        status,
        nome,
        tipoResiduo,
        linhaId,
      },
    });

    return NextResponse.json(caixaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar caixa." },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE - Remover caixa
export async function DELETE(req: Request, { params }: Params) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID da caixa inválido." },
      { status: 400 }
    );
  }

  try {
    await prisma.caixa.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Caixa deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao deletar caixa." },
      { status: 500 }
    );
  }
}