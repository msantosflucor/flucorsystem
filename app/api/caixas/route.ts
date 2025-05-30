import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const caixas = await prisma.caixa.findMany({
      orderBy: { nome: "asc" },
      include: { linha: true },
    });

    return NextResponse.json(
      caixas.map((c) => ({
        id: c.id,
        nome: c.nome,
        tipoResiduo: c.tipoResiduo,
        status: c.status,
        linha: c.linha?.nome || null,
      }))
    );
  } catch (error) {
    console.error("Erro ao buscar caixas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caixas." },
      { status: 500 }
    );
  }
}