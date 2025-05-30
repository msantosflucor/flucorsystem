import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const caixas = await prisma.caixa.findMany({
      where: { status: "livre" },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(caixas);
  } catch (error) {
    console.error("Erro ao buscar caixas disponíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar caixas livres." },
      { status: 500 }
    );
  }
}