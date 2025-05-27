import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID da caixa inválido ou ausente." },
      { status: 400 }
    );
  }

  const { status } = await req.json();

  if (!status) {
    return NextResponse.json(
      { error: "Status é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const caixaAtualizada = await prisma.caixa.update({
      where: { id },
      data: { status },
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