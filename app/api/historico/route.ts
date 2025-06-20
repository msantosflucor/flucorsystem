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
        caminhao: {
          include: {
            analises: {
              orderBy: { criadoEm: "desc" },
              select: {
                id: true,
                liberadaIncompativel: true,
                justificativaLiberacaoIncompativel: true,
                criadoEm: true,
              },
            },
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    const historico = analises.map((item) => {
      const caminhao = item.caminhao;
      const horaSaida = caminhao?.horaSaida;
      const entrada = caminhao?.criadoEm;
      const tempoLiberacaoMin =
        horaSaida && entrada
          ? Math.round((horaSaida.getTime() - entrada.getTime()) / 60000)
          : null;

      const todasAnalises = caminhao?.analises || [];

      return {
        id: item.id.toString(),
        caminhaoId: item.caminhaoId,
        plate: caminhao?.placa || "N/A",
        collectionDate: caminhao?.horaColeta || null,
        horaSaida,
        tempoLiberacaoMin,
        destination: item.tanque || "N/D",
        manual: caminhao?.manual ?? false, // ✅ CORRIGIDO AQUI
        observations: item.observacoes || "Sem observações",
        transportadora: caminhao?.transportadora || "N/D",
        entryDate: entrada || null,
        status: item.status,
        motivoLiberacao: item.motivoLiberacaoSemDescarga || null,
        analises: todasAnalises.map(a => ({
          liberadaIncompativel: a.liberadaIncompativel,
          justificativaLiberacaoIncompativel: a.justificativaLiberacaoIncompativel,
          dataAnalise: a.criadoEm
        })),
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