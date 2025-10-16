import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { StatusCaminhao, TipoResiduo } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET: listar análises incompatíveis
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

// POST: registrar nova análise (descarga ou carregamento)
export async function POST(req: NextRequest) {
  try {
    const {
      caminhaoId,
      status,
      tanque,
      observacoes,
      tipoResiduo,
      destino,
      outroDestino,
      origem,
      responsavelLiberacao, // CAMPO ADICIONADO
    } = await req.json();

    if (!caminhaoId || !status || !tanque) {
      return NextResponse.json(
        { error: "Dados obrigatórios faltando." },
        { status: 400 }
      );
    }

    const novaAnalise = await prisma.analise.create({
      data: {
        caminhaoId,
        status: status as StatusCaminhao,
        tanque,
        observacoes,
        tipoResiduo: tipoResiduo as TipoResiduo || null,
        destino,
        outroDestino,
        origem,
        responsavelLiberacao, // SALVAR NO BANCO
      },
    });

    // Atualiza o status do caminhão
    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: { status: status as StatusCaminhao },
    });

    return NextResponse.json(novaAnalise, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar análise:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar análise." },
      { status: 500 }
    );
  }
}