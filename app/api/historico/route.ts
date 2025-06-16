import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const analises = await prisma.analise.findMany({
      where: {
        status: "finalizado",
        caminhao: {
          status: "finalizado",
        },
      },
      include: {
        caminhao: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    const historico = analises.map((item) => {
      const horaSaida = item.caminhao?.horaSaida;
      const entrada = item.caminhao?.criadoEm;
      const tempoLiberacaoMin =
        horaSaida && entrada
          ? Math.round((horaSaida.getTime() - entrada.getTime()) / 60000)
          : null;

      return {
        id: item.id.toString(),
        caminhaoId: item.caminhaoId,
        plate: item.caminhao?.placa || "N/A",
        collectionDate: item.caminhao?.horaColeta || null,
        horaSaida,
        tempoLiberacaoMin,
        destination: item.tanque || "N/D",
        manual: item.caminhao?.aguardarNaCaixa || false,
        observations: item.observacoes || "Sem observações",
        transportadora: item.caminhao?.transportadora || "N/D",
        entryDate: entrada || null,
        status: item.status,
        motivoLiberacao: item.motivoLiberacaoSemDescarga || null,
      };
    });

    return NextResponse.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar histórico." },
      { status: 500 }
    );
  }
}