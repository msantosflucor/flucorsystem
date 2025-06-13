export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH → Encaminhar caminhão para uma caixa
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caminhaoId = parseInt(params.id);

  if (isNaN(caminhaoId)) {
    return NextResponse.json(
      { error: "ID do caminhão inválido." },
      { status: 400 }
    );
  }

  try {
    const { caixaId } = await req.json();

    if (!caixaId || isNaN(parseInt(caixaId))) {
      return NextResponse.json(
        { error: "ID da caixa inválido ou ausente." },
        { status: 400 }
      );
    }

    const caixa = await prisma.caixa.findUnique({
      where: { id: parseInt(caixaId) },
    });

    if (!caixa) {
      return NextResponse.json(
        { error: "Caixa não encontrada." },
        { status: 404 }
      );
    }

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
      include: {
        analises: {
          orderBy: { criadoEm: "desc" },
          take: 1,
        },
      },
    });

    if (!caminhao) {
      return NextResponse.json(
        { error: "Caminhão não encontrado." },
        { status: 404 }
      );
    }

    const ultimaAnalise = caminhao.analises?.[0];

    if (!ultimaAnalise || ultimaAnalise.status !== "approved") {
      return NextResponse.json(
        { error: "A análise do caminhão não foi aprovada." },
        { status: 403 }
      );
    }

    // Encaminha o caminhão para a caixa (sem ocupar ainda)
    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        destinoCaixaId: caixa.id,
      },
    });

    return NextResponse.json({
      message: `Caminhão ${caminhao.placa} encaminhado para a caixa ${caixa.nome}.`,
    });
  } catch (error) {
    console.error("Erro ao encaminhar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao encaminhar caminhão para caixa." },
      { status: 500 }
    );
  }
}