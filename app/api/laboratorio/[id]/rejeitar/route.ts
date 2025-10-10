import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const analiseId = parseInt(params.id);

  if (isNaN(analiseId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    // Atualiza a análise
    const analise = await prisma.analise.update({
      where: { id: analiseId },
      data: { status: StatusCaminhao.rejected },
      include: { caminhao: true },
    });

    // Atualiza também o caminhão vinculado
    await prisma.caminhao.update({
      where: { id: analise.caminhaoId },
      data: { status: StatusCaminhao.rejected },
    });

    return NextResponse.json({ message: "Amostra rejeitada com sucesso" });
  } catch (error) {
    console.error("Erro ao rejeitar amostra:", error);
    return NextResponse.json(
      { error: "Erro ao rejeitar análise." },
      { status: 500 }
    );
  }
}