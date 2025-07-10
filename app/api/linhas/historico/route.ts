import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const linhas = await prisma.linha.findMany({
      orderBy: { nome: "asc" },
      include: {
        manutencoes: {
          orderBy: { criadoEm: "desc" },
          select: {
            id: true,
            motivo: true,
            criadoEm: true,
            finalizadoEm: true,
          },
        },
      },
    });

    const resultado = linhas.map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      manutencoes: linha.manutencoes,
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar histórico completo das linhas:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
