import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const caixas = await prisma.caixa.findMany({
      orderBy: { nome: "asc" },
      include: { linha: true },
    });

    // Buscar placas dos caminhões ocupando as caixas
    const caixasComPlaca = await Promise.all(
      caixas.map(async (caixa) => {
        let caminhaoPlaca = null;

        if (caixa.status === "ocupada") {
          const caminhao = await prisma.caminhao.findFirst({
            where: {
              caixaId: caixa.id,
              status: { in: ["waiting", "approved"] }, // ✅ inclui liberados também
            },
            select: { placa: true },
          });

          caminhaoPlaca = caminhao?.placa || null;
        }

        return {
          id: caixa.id,
          nome: caixa.nome,
          tipoResiduo: caixa.tipoResiduo,
          status: caixa.status,
          linha: caixa.linha?.nome || null,
          caminhaoPlaca,
        };
      })
    );

    return NextResponse.json(caixasComPlaca);
  } catch (error) {
    console.error("Erro ao buscar caixas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caixas." },
      { status: 500 }
    );
  }
}