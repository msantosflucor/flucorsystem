import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Listar todos os colaboradores com seus veículos
export async function GET() {
  try {
    const colaboradores = await prisma.colaborador.findMany({
      orderBy: { nome: "asc" },
      include: { veiculos: true },
    });

    return NextResponse.json({ colaboradores });
  } catch (error) {
    console.error("Erro ao buscar colaboradores:", error);
    return NextResponse.json(
      { error: "Erro ao buscar colaboradores" },
      { status: 500 }
    );
  }
}

// POST - Cadastrar novo colaborador com múltiplos veículos
export async function POST(req: NextRequest) {
  try {
    const {
      nome,
      documento,
      tipoCombustivel,
      litrosCombustivel,
      veiculos,
    } = await req.json();

    if (!nome || !documento || !veiculos || veiculos.length === 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando." },
        { status: 400 }
      );
    }

    const novoColaborador = await prisma.colaborador.create({
      data: {
        nome,
        documento,
        tipoCombustivel,
        litrosCombustivel,
        veiculos: {
          create: veiculos.map((v: any) => ({
            placa: v.placa,
            modelo: v.modelo,
            cor: v.cor,
          })),
        },
      },
      include: { veiculos: true },
    });

    return NextResponse.json(novoColaborador);
  } catch (error) {
    console.error("Erro ao cadastrar colaborador:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar colaborador" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar colaborador + veículos
export async function PATCH(req: NextRequest) {
  try {
    const {
      id,
      nome,
      documento,
      tipoCombustivel,
      litrosCombustivel,
      veiculos,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID do colaborador é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.veiculo.deleteMany({ where: { colaboradorId: id } });

    const colaboradorAtualizado = await prisma.colaborador.update({
      where: { id },
      data: {
        nome,
        documento,
        tipoCombustivel,
        litrosCombustivel: litrosCombustivel,
        veiculos: {
          create: veiculos.map((v: any) => ({
            placa: v.placa,
            modelo: v.modelo,
            cor: v.cor,
          })),
        },
      },
      include: { veiculos: true },
    });

    return NextResponse.json(colaboradorAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar colaborador" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir colaborador
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID não fornecido." },
        { status: 400 }
      );
    }

    // Remove todos os veículos associados primeiro (por segurança)
    await prisma.veiculo.deleteMany({
      where: { colaboradorId: parseInt(id) },
    });

    // Depois exclui o colaborador
    await prisma.colaborador.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ 
      message: "Colaborador excluído com sucesso." 
    });
  } catch (error) {
    console.error("Erro ao excluir colaborador:", error);
    return NextResponse.json(
      { error: "Erro ao excluir colaborador" },
      { status: 500 }
    );
  }
}