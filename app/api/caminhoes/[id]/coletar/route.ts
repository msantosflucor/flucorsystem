import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = async (req: NextRequest) => {
  try {
    const match = req.nextUrl.pathname.match(/\/api\/caminhoes\/(\d+)\/coletar$/);
    const caminhaoId = match ? Number(match[1]) : NaN;

    if (isNaN(caminhaoId)) {
      return NextResponse.json({ error: "ID de caminhão inválido." }, { status: 400 });
    }

    const atualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        horaColeta: new Date(),
        status: "in_progress", // status atualizado corretamente
      },
    });

    return NextResponse.json({
      message: "Coleta registrada com sucesso",
      caminhao: atualizado,
    });
  } catch (error) {
    console.error("Erro ao registrar coleta:", error);
    return NextResponse.json({ error: "Erro interno ao registrar coleta." }, { status: 500 });
  }
};
