import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Obter caminhão pelo ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    const caminhao = await prisma.caminhao.findUnique({
      where: { id },
      include: {
        caixa: true,
      },
    });

    if (!caminhao) {
      return NextResponse.json(
        { error: "Caminhão não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(caminhao);
  } catch (error) {
    console.error("Erro ao buscar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caminhão." },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar caminhão pelo ID
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const caminhaoAtual = await prisma.caminhao.findUnique({ where: { id } });

    if (!caminhaoAtual) {
      return NextResponse.json(
        { error: "Caminhão não encontrado." },
        { status: 404 }
      );
    }

    const {
      placa,
      origem,
      caixaId,
      status,
      tipo,
      aguardarNaCaixa,
      manual,
    } = body;

    // Determina se é um movimento para caixa vindo do estacionamento
    const isMovimentoParaCaixa = caixaId && caminhaoAtual.origem === 'estacionamento';
    
    const caminhaoAtualizado = await prisma.caminhao.update({
      where: { id },
      data: {
        placa,
        origem,
        caixaId,
        status,
        tipo,
        aguardarNaCaixa,
        manual: isMovimentoParaCaixa ? true : (manual ?? caminhaoAtual.manual),
      },
    });

    return NextResponse.json(caminhaoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar caminhão." },
      { status: 500 }
    );
  }
}

// DELETE - Remover caminhão pelo ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    await prisma.caminhao.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Caminhão deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao deletar caminhão." },
      { status: 500 }
    );
  }
}