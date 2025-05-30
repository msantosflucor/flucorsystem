import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { StatusCaminhao, StatusCaixa } from "@prisma/client";

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

    const caixa = await prisma.caixa.findUnique({ where: { id: caixaId } });

    if (!caixa) {
      return NextResponse.json(
        { error: "Caixa não encontrada." },
        { status: 404 }
      );
    }

    // 🚚 Se o caminhão deve aguardar na caixa, ele entra direto como "waiting"
    // 🅿️ Se não for aguardar, entra no pátio (status in_progress) e grava o destino
    const novoCaminhao = await prisma.caminhao.create({
      data: {
        placa,
        origem,
        caixaId: aguardarNaCaixa ? caixaId : null,
        destinoCaixaId: aguardarNaCaixa ? null : caixaId,
        aguardarNaCaixa,
        status: aguardarNaCaixa
          ? StatusCaminhao.waiting
          : StatusCaminhao.in_progress,
        tipo: tipo ?? "Diversos",
      },
      include: {
        caixa: true,
      },
    });

    // 🔄 Atualiza status da caixa se o caminhão estiver aguardando nela
    if (aguardarNaCaixa) {
      await prisma.caixa.update({
        where: { id: caixaId },
        data: { status: StatusCaixa.ocupada },
      });
    }

    return NextResponse.json(novoCaminhao, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar caminhão." },
      { status: 500 }
    );
  }
}

// ✅ GET - Listar todos os caminhões
export async function GET() {
  try {
    const caminhoes = await prisma.caminhao.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        caixa: true,
      },
    });

    const resultado = caminhoes.map((c) => ({
      id: c.id,
      placa: c.placa,
      origem: c.origem,
      criadoEm: c.criadoEm,
      status: c.status,
      tipo: c.tipo,
      aguardarNaCaixa: c.aguardarNaCaixa,
      destinoCaixaId: c.destinoCaixaId,
      caixa: c.caixa
        ? {
            id: c.caixa.id,
            nome: c.caixa.nome,
            tipoResiduo: c.caixa.tipoResiduo,
          }
        : null,
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
