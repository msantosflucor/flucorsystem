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
    // Finaliza o carregamento sem alterar horaSaida
    const atualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        horaFimCarregamento: new Date(),
        status: StatusCaminhao.finalizado,
      },
    });

    return NextResponse.json({
      message: "Carregamento finalizado.",
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
