import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ✅ POST - Registrar uma nova análise e atualizar o status do caminhão
export async function POST(req: Request) {
  try {
    const { caminhaoId, status, tanque, observacoes } = await req.json();

    if (!caminhaoId || !status || !tanque) {
      return NextResponse.json(
        { error: "Dados obrigatórios faltando." },
        { status: 400 }
      );
    }

    // Cria o registro da análise
    const novaAnalise = await prisma.analise.create({
      data: {
        caminhaoId,
        status,
        tanque,
        observacoes: observacoes || "",
      },
      include: {
        caminhao: true,
      },
    });

    // Atualiza o status do caminhão
    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: { status },
    });

    return NextResponse.json(novaAnalise, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar análise:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar análise." },
      { status: 500 }
    );
  }
}

// ✅ GET - Listar todas as análises
export async function GET() {
  try {
    const analises = await prisma.analise.findMany({
      include: {
        caminhao: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return NextResponse.json(analises, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar análises:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar análises." },
      { status: 500 }
    );
  }
}