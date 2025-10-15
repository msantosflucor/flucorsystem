import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caminhaoId = parseInt(params.id);

  if (isNaN(caminhaoId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    // Verifica se o caminhão existe
    const caminhaoExistente = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
    });

    if (!caminhaoExistente) {
      return NextResponse.json({ error: "Caminhão não encontrado." }, { status: 404 });
    }

    // Finaliza o carregamento apenas setando horaFimCarregamento
    // Mantém o caminhão visível (não move para histórico)
    // Não altera o status para finalizado
    const atualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        horaFimCarregamento: new Date(),
        // Status mantém o valor atual, não é alterado para "finalizado"
      },
    });

    return NextResponse.json({
      message: "Carregamento finalizado. Aguardando pós-análise.",
      caminhao: atualizado,
    });
  } catch (error) {
    console.error("Erro ao finalizar carregamento:", error);
    return NextResponse.json(
      { error: "Erro ao finalizar o carregamento." },
      { status: 500 }
    );
  }
}