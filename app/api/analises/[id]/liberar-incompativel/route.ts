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

  try {
    // Atualiza a análise como liberada e aprovada
    const analiseAtualizada = await prisma.analise.update({
      where: { id: analiseId },
      data: {
        liberadaIncompativel: true,
        status: "approved", // ✅ libera a análise para o fluxo normal
      },
      include: { caminhao: true },
    });

    // Atualiza o status do caminhão vinculado (opcional, se necessário)
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
