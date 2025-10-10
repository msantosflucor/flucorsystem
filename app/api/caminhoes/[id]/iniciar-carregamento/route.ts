import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caminhaoId = parseInt(params.id);

  if (isNaN(caminhaoId)) {
    return NextResponse.json({ error: "ID do caminhão inválido." }, { status: 400 });
  }

  try {
    const atualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        horaInicioCarregamento: new Date(),
      },
    });

    return NextResponse.json({
      message: "Início do carregamento registrado com sucesso.",
      caminhao: atualizado,
    });
  } catch (error) {
    console.error("Erro ao iniciar carregamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar início do carregamento." },
      { status: 500 }
    );
  }
}
