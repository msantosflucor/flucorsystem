import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const analiseId = parseInt(params.id);

  if (isNaN(analiseId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const body = await req.json();
  const { justificativa } = body;

  if (!justificativa || !justificativa.trim()) {
    return NextResponse.json(
      { error: "Justificativa obrigatória." },
      { status: 400 }
    );
  }

  try {
    const analiseAtualizada = await prisma.analise.update({
      where: { id: analiseId },
      data: {
        liberadaIncompativel: true,
        status: "approved",
        justificativaLiberacaoIncompativel: justificativa.trim(),
      },
      include: { caminhao: true },
    });

    await prisma.caminhao.update({
      where: { id: analiseAtualizada.caminhaoId },
      data: {
        status: "in_progress",
      },
    });

    return NextResponse.json(analiseAtualizada);
  } catch (error) {
    console.error("Erro ao liberar amostra incompatível:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar análise." },
      { status: 500 }
    );
  }
}