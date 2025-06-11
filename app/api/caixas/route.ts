import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const caixas = await prisma.caixa.findMany({
      orderBy: { nome: "asc" },
      include: { linha: true },
    });

    const caixasComCaminhao = await Promise.all(
      caixas.map(async (caixa) => {
        let caminhaoPlaca = null;
        let caminhaoId = null;
        let fila: { id: number; placa: string; status: string }[] = [];

        if (caixa.status === "ocupada") {
          const caminhao = await prisma.caminhao.findFirst({
            where: {
              caixaId: caixa.id,
              status: {
                in: ["waiting", "approved", "in_progress"],
              },
            },
            orderBy: {
              criadoEm: "desc",
            },
            select: {
              id: true,
              placa: true,
            },
          });

          caminhaoPlaca = caminhao?.placa || null;
          caminhaoId = caminhao?.id || null;
        }

        // ✅ Caminhões na fila aguardando essa caixa
        const filaCaminhoes = await prisma.caminhao.findMany({
          where: {
            caixaId: null,
            destinoCaixaId: caixa.id,
            status: {
              not: "finalizado",
            },
          },
          orderBy: {
            criadoEm: "asc", // primeiro da fila
          },
          select: {
            id: true,
            placa: true,
            status: true,
          },
        });

        fila = filaCaminhoes;

        return {
          id: caixa.id,
          nome: caixa.nome,
          tipoResiduo: caixa.tipoResiduo,
          status: caixa.status,
          linha: caixa.linha
            ? { id: caixa.linha.id, nome: caixa.linha.nome }
            : null,
          caminhaoPlaca,
          caminhaoId,
          fila, // ✅ nova propriedade com a fila de caminhões
          criadoEm: caixa.criadoEm,
        };
      })
    );

    return NextResponse.json(caixasComCaminhao);
  } catch (error) {
    console.error("Erro ao buscar caixas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caixas." },
      { status: 500 }
    );
  }
}