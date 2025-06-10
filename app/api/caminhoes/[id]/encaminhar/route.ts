import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH: Encaminhar caminhão manualmente para uma caixa
export async function PATCH(
  req: NextRequest,
  context: any
) {
  try {
    const id = context?.params?.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "ID do caminhão inválido." },
        { status: 400 }
      );
    }

    const caminhaoId = Number(id);
    const { caixaId } = await req.json();

    if (!caixaId) {
      return NextResponse.json(
        { error: "caixaId é obrigatório." },
        { status: 400 }
      );
    }

    const caixa = await prisma.caixa.findUnique({
      where: { id: caixaId },
    });

    if (!caixa) {
      return NextResponse.json(
        { error: "Caixa não encontrada." },
        { status: 404 }
      );
    }

    if (caixa.status !== "livre") {
      return NextResponse.json(
        { error: "A caixa selecionada está ocupada." },
        { status: 409 }
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

    await prisma.$transaction([
      prisma.caminhao.update({
        where: { id: caminhaoId },
        data: {
          caixaId,
          ...(caminhao.status === "in_progress" && { status: "waiting" }),
        },
      }),
      prisma.caixa.update({
        where: { id: caixaId },
        data: { status: "ocupada" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao encaminhar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao encaminhar caminhão." },
      { status: 500 }
    );
  }
}