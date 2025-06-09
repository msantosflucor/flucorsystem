export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH → Mover caminhão manualmente para uma caixa
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

    const caixa = await prisma.caixa.findUnique({
      where: { id: parseInt(caixaId) },
    });

    if (!caixa) {
      return NextResponse.json({ error: "Caixa não encontrada." }, { status: 404 });
    }

    if (caixa.status !== "livre") {
      return NextResponse.json({ error: "A caixa selecionada não está livre." }, { status: 400 });
    }

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
    });

    if (!caminhao) {
      return NextResponse.json({ error: "Caminhão não encontrado." }, { status: 404 });
    }

    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        caixaId: caixa.id,
        destinoCaixaId: null,
        ...(caminhao.status === "in_progress" && { status: "waiting" }),
      },
    });

    await prisma.caixa.update({
      where: { id: caixa.id },
      data: { status: "ocupada" },
    });

    return NextResponse.json({
      message: `Caminhão movido com sucesso para a caixa ${caixa.nome}.`,
    });
  } catch (error) {
    console.error("Erro ao mover caminhão para caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao mover caminhão para caixa." },
      { status: 500 }
    );
  }
}