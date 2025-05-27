import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { StatusCaixa, StatusCaminhao, TipoResiduo } from "@prisma/client";

// ✅ POST - Cadastrar novo caminhão
export async function POST(req: Request) {
  try {
    const { placa, origem, caixaId, aguardarNaCaixa, tipo } = await req.json();

    if (!placa || !caixaId || aguardarNaCaixa === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando." },
        { status: 400 }
      );
    }

    const novo = await prisma.caminhao.create({
      data: {
        placa,
        origem,
        caixaId,
        aguardarNaCaixa,
        status: aguardarNaCaixa
          ? StatusCaminhao.waiting
          : StatusCaminhao.in_progress,
        tipo: tipo ?? TipoResiduo.Diversos,
      },
      include: {
        caixa: true,
      },
    });

    // Atualiza o status da caixa se for aguardar na caixa
    if (aguardarNaCaixa) {
      await prisma.caixa.update({
        where: { id: caixaId },
        data: { status: StatusCaixa.ocupada },
      });
    }

    return NextResponse.json(novo, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar caminhão." },
      { status: 500 }
    );
  }
}

// ✅ GET - Listar caminhões aguardando análise
export async function GET() {
  try {
    const caminhoes = await prisma.caminhao.findMany({
      where: {
        status: StatusCaminhao.waiting, // Só traz caminhões aguardando análise
      },
      orderBy: { criadoEm: "desc" },
      include: {
        caixa: true,
      },
    });

    const resultado = caminhoes.map((c) => ({
      id: c.id,
      placa: c.placa,
      origem: c.origem,
      aguardarNaCaixa: c.aguardarNaCaixa,
      criadoEm: c.criadoEm,
      status: c.status,
      tipo: c.tipo,
      caixa: {
        id: c.caixa?.id,
        nome: c.caixa?.nome,
        tipoResiduo: c.caixa?.tipoResiduo,
      },
    }));

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar caminhões:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caminhões." },
      { status: 500 }
    );
  }
}