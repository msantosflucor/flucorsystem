import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";

export async function GET() {
  try {
    const analises = await prisma.analise.findMany({
      where: {
        caminhao: {
          status: StatusCaminhao.finalizado, // ✅ Só mostra caminhões finalizados (após liberar caixa)
        },
      },
      include: {
        caminhao: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    const historico = analises.map((item) => ({
      id: item.id.toString(),
      plate: item.caminhao?.placa || "N/A",
      collectionDate: item.criadoEm,
      releaseTime: calcularTempoLiberacao(item.criadoEm),
      destination: item.tanque || "N/D",
      manual: item.caminhao?.aguardarNaCaixa || false,
      observations: item.observacoes || "Sem observações",
      origin: item.caminhao?.origem || "N/D",
    }));

    return NextResponse.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar histórico." },
      { status: 500 }
    );
  }
}

function calcularTempoLiberacao(data: Date) {
  const agora = new Date();
  const diffMs = agora.getTime() - new Date(data).getTime();
  const minutos = Math.floor(diffMs / (1000 * 60));
  return `${minutos} min`;
}
