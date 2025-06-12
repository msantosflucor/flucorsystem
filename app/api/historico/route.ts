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

    const historico = analises.map((item) => ({
      id: item.id.toString(), // ID da análise
      caminhaoId: item.caminhaoId, // usado no botão Concluir Saída
      plate: item.caminhao?.placa || "N/A",
      collectionDate: item.caminhao?.horaColeta || null,
      horaSaida: item.caminhao?.horaSaida || null, // ✅ nome esperado pelo front
      tempoLiberacaoMin: item.caminhao?.tempoLiberacaoMin ?? null, // ✅ nome esperado pelo front
      destination: item.tanque || "N/D",
      manual: item.caminhao?.aguardarNaCaixa || false,
      observations: item.observacoes || "Sem observações",
      origin: item.caminhao?.origem || "N/D",
      entryDate: item.caminhao?.criadoEm || null,
      status: item.status,
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
