import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const acessoId = parseInt(params.id);

  if (isNaN(acessoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const acesso = await prisma.acesso.findUnique({ where: { id: acessoId } });

    if (!acesso) {
      return NextResponse.json({ error: "Acesso não encontrado" }, { status: 404 });
    }

    if (acesso.dataSaida) {
      return NextResponse.json(
        { error: "A saída já foi registrada." },
        { status: 400 }
      );
    }

    const atualizado = await prisma.acesso.update({
      where: { id: acessoId },
      data: { dataSaida: new Date() },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro ao registrar saída:", error);
    return NextResponse.json(
      { error: "Erro interno ao registrar saída." },
      { status: 500 }
    );
  }
}
