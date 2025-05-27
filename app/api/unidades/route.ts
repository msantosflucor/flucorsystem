import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Lista todas as unidades
export async function GET() {
  try {
    const unidades = await prisma.unidade.findMany({
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json(unidades);
  } catch (error) {
    console.error("Erro ao listar unidades:", error);
    return new NextResponse("Erro ao buscar unidades", { status: 500 });
  }
}

// POST: Cadastra nova unidade com validação
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { nome, corHex } = data;

    if (!nome || !corHex) {
      return new NextResponse("Campos 'nome' e 'corHex' são obrigatórios", { status: 400 });
    }

    const novaUnidade = await prisma.unidade.create({
      data: {
        nome,
        corHex,
      },
    });

    return NextResponse.json(novaUnidade, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar unidade:", error);
    return new NextResponse("Erro ao criar unidade", { status: 500 });
  }
}
