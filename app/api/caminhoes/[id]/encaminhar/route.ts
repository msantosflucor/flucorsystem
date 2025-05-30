import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = {
  params: {
    id: string;
  };
};

export async function PATCH(req: Request, { params }: Params) {
  const caminhaoId = Number(params.id);
  const { caixaId } = await req.json();

  if (!caminhaoId || !caixaId) {
    return NextResponse.json(
      { error: "Parâmetros caminhaoId e caixaId são obrigatórios." },
      { status: 400 }
    );
  }

  try {
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

    // Atualiza caminhão e caixa
    await prisma.$transaction([
      prisma.caminhao.update({
        where: { id: caminhaoId },
        data: {
          caixaId: caixaId,
          status: "waiting", // aguardando na caixa
        },
      }),
      prisma.caixa.update({
        where: { id: caixaId },
        data: {
          status: "ocupada",
        },
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