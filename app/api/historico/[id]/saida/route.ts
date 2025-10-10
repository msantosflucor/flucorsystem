import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const caminhao = await prisma.caminhao.update({
      where: { id },
      data: {
        horaSaida: new Date(),
        tempoLiberacaoMin: {
          set: prisma.$queryRaw`TIMESTAMPDIFF(MINUTE, horaColeta, NOW())`,
        },
      },
    });

    return NextResponse.json(caminhao);
  } catch (error) {
    console.error("Erro ao registrar saída:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
