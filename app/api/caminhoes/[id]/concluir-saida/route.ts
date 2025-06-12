export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caminhaoId = parseInt(params.id);

  if (isNaN(caminhaoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
    });

    console.log("🚚 Caminhão retornado:", caminhao);

    if (!caminhao?.horaColeta || isNaN(new Date(caminhao.horaColeta).getTime())) {
      return NextResponse.json(
        { error: "Caminhão sem hora de coleta registrada." },
        { status: 400 }
      );
    }

    const agora = new Date();
    const diffMin = Math.round(
      (agora.getTime() - new Date(caminhao.horaColeta).getTime()) / 60000
    );

    const atualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        horaSaida: agora,
        tempoLiberacaoMin: diffMin,
      },
    });

    return NextResponse.json({
      horaSaida: atualizado.horaSaida,
      tempoLiberacaoMin: atualizado.tempoLiberacaoMin,
    });
  } catch (error) {
    console.error("Erro ao concluir saída:", error);
    return NextResponse.json(
      { error: "Erro interno ao concluir saída" },
      { status: 500 }
    );
  }
}