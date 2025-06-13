import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const analises = await prisma.analise.findMany({
      where: {
        status: "incompatible",
        liberadaIncompativel: false,
      },
      include: {
        caminhao: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json(analises);
  } catch (error) {
    console.error("Erro ao buscar análises incompatíveis:", error);
    return NextResponse.json(
      { error: "Erro ao buscar análises incompatíveis" },
      { status: 500 }
    );
  }
}