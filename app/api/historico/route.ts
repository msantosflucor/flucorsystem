import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const caminhoes = await prisma.caminhao.findMany({
      where: {
        status: "finalizado",
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        analises: {
          orderBy: { criadoEm: "desc" },
          select: {
            id: true,
            status: true,
            liberadaIncompativel: true,
            justificativaLiberacaoIncompativel: true,
            criadoEm: true,
            tanque: true,
            observacoes: true,
            tipoResiduo: true,
            motivoLiberacaoSemDescarga: true,
          },
        },
      },
    });

    const historico = caminhoes.map((caminhao) => {
      const analise = caminhao.analises[0];
      const entrada = caminhao.criadoEm;
      const saida = caminhao.horaSaida ?? null;

      const tempoLiberacaoMin =
        saida && entrada
          ? Math.round((saida.getTime() - entrada.getTime()) / 60000)
          : null;

      return {
        id: caminhao.id.toString(),
        caminhaoId: caminhao.id,
        plate: caminhao.placa,
        motorista: caminhao.motorista ?? "N/D", // ✅ Adicionado aqui
        collectionDate: caminhao.horaColeta || null,
        horaSaida: saida,
        tempoLiberacaoMin,
        destination: analise?.tanque || "N/D",
        manual: caminhao.manual ?? false,
        observations: analise?.observacoes || "Sem observações",
        transportadora: caminhao.transportadora,
        entryDate: caminhao.criadoEm,
        status: analise?.status || caminhao.status,
        motivoLiberacao: analise?.motivoLiberacaoSemDescarga || null,
        horaInicioCarregamento: caminhao.horaInicioCarregamento || null,
        horaFimCarregamento: caminhao.horaFimCarregamento || null,
        analises: caminhao.analises.map((a) => ({
          liberadaIncompativel: a.liberadaIncompativel,
          justificativaLiberacaoIncompativel: a.justificativaLiberacaoIncompativel,
          dataAnalise: a.criadoEm,
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
