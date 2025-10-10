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
    // Atualiza o caminhão como rejeitado para carregamento
    const caminhao = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        status: StatusCaminhao.rejected,
      },
    });

    return NextResponse.json({
      message: "Caminhão teve o carregamento negado.",
      caminhao,
    });
  } catch (error) {
    console.error("Erro ao negar carregamento:", error);
    return NextResponse.json(
      { error: "Erro ao negar o carregamento." },
      { status: 500 }
    );
  }
}
