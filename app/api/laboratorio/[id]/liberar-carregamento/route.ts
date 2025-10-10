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
    // Atualiza o caminhão como aprovado para carregamento
    const caminhao = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        status: StatusCaminhao.approved, // Reaproveitando status "approved"
      },
    });

    return NextResponse.json({
      message: "Caminhão liberado para carregamento.",
      caminhao,
    });
  } catch (error) {
    console.error("Erro ao liberar carregamento:", error);
    return NextResponse.json(
      { error: "Erro ao liberar o carregamento." },
      { status: 500 }
    );
  }
}