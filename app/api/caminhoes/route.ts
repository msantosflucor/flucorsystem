import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";

// ✅ POST - Cadastrar novo caminhão
export async function POST(req: Request) {
  try {
    const { placa, motorista, transportadora } = await req.json();

    if (!placa || !motorista || !transportadora) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando." },
        { status: 400 }
      );
    }

    const novoCaminhao = await prisma.caminhao.create({
      data: {
        placa,
        motorista,
        transportadora,
        status: StatusCaminhao.in_progress,
        criadoEm: new Date(),
      },
    });

    return NextResponse.json(novoCaminhao, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar caminhão." },
      { status: 500 }
    );
  }
}

// ✅ GET - Listar todos os caminhões com caixa e análises incluídas
export async function GET() {
  try {
    const caminhoes = await prisma.caminhao.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        caixa: true,
        destinoCaixa: true,
        analises: true, // ✅ Correto: múltiplas análises
      },
    });

    return NextResponse.json(caminhoes);
  } catch (error) {
    console.error("Erro ao buscar caminhões:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caminhões." },
      { status: 500 }
    );
  }
}