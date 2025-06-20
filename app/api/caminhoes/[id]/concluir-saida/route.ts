export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caminhaoId = parseInt(params.id);

  if (isNaN(caminhaoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
      select: {
        id: true,
        horaColeta: true,
        criadoEm: true,
        manual: true, // ✅ Garantir que o campo manual seja incluído na consulta
        status: true,
      },
    });

    if (!caminhao) {
      return NextResponse.json(
        { error: "Caminhão não encontrado." },
        { status: 404 }
      );
    }

    const agora = new Date();
    const referenciaInicio = caminhao.horaColeta
      ? new Date(caminhao.horaColeta)
      : new Date(caminhao.criadoEm);

    const diffMin = Math.round(
      (agora.getTime() - referenciaInicio.getTime()) / 60000
    );

    const atualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        horaSaida: agora,
        tempoLiberacaoMin: diffMin,
        status: "finalizado",
        // Não altera o campo 'manual' - mantém o valor existente
      },
    });

    return NextResponse.json({
      horaSaida: atualizado.horaSaida,
      tempoLiberacaoMin: atualizado.tempoLiberacaoMin,
      manual: atualizado.manual, // ✅ Retorna o status manual para confirmação
    });
  } catch (error) {
    console.error("Erro ao concluir saída:", error);
    return NextResponse.json(
      { error: "Erro interno ao concluir saída" },
      { status: 500 }
    );
  }
}