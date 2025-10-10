import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ultimosCaminhoes = await prisma.caminhao.findMany({
      take: 10,
      orderBy: {
        criadoEm: "desc",
      },
      select: {
        id: true,
        placa: true,
        transportadora: true,
        criadoEm: true,
        horaSaida: true,
      },
    });

    return NextResponse.json(ultimosCaminhoes);
  } catch (error) {
    console.error("Erro ao buscar últimos caminhões:", error);
    return new NextResponse("Erro ao buscar caminhões", { status: 500 });
  }
}