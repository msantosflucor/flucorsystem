import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const linhaId = Number(context.params.id);

    if (isNaN(linhaId)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const registros = await prisma.manutencaoLinha.findMany({
      where: { linhaId },
      orderBy: { criadoEm: "desc" },
    });

    const historico = registros.map((item) => ({
      id: item.id,
      linhaId: item.linhaId,
      motivo: item.motivo,
      criadoEm: item.criadoEm,
      finalizadoEm: item.finalizadoEm,
    }));

    return NextResponse.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico de manutenções:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar histórico de manutenções." },
      { status: 500 }
    );
  }
}