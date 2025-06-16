import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";
import { registrarLog } from "@/lib/log-usuario";

// ✅ POST - Cadastrar novo caminhão com campos estendidos
export async function POST(req: NextRequest) {
  try {
    const {
      placa,
      motorista,
      transportadora,
      documentoMotorista,
      possuiMTR = false,
      possuiNotaFiscal = false,
      anomaliaVeiculo = false,
      descricaoAnomalia = null,
      possuiEPI = false,
      vestimentaIrregular = false,
      estadoFisico = null,
    } = await req.json();

    if (!placa || !motorista || !transportadora || !documentoMotorista) {
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
        documentoMotorista,
        possuiMTR,
        possuiNotaFiscal,
        anomaliaVeiculo,
        descricaoAnomalia,
        possuiEPI,
        vestimentaIrregular,
        estadoFisico,
        status: StatusCaminhao.in_progress,
        criadoEm: new Date(),
      },
    });

    await registrarLog("Cadastrou caminhão", "Cadastro Caminhão");

    return NextResponse.json(novoCaminhao, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar caminhão:", error);
    return NextResponse.json(
      { error: "Erro interno ao salvar caminhão." },
      { status: 500 }
    );
  }
}

// ✅ GET - Listar todos os caminhões com análises e caixas incluídas
export async function GET() {
  try {
    const caminhoes = await prisma.caminhao.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        caixa: true,
        destinoCaixa: true,
        analises: {
          orderBy: { criadoEm: "desc" },
          take: 1, // pega só a análise mais recente
        },
      },
    });

    const caminhoesComFlag = caminhoes.map((caminhao) => {
      const ultimaAnalise = caminhao.analises[0];
      return {
        ...caminhao,
        liberadaIncompativel: !!ultimaAnalise?.liberadaIncompativel,
      };
    });

    return NextResponse.json(caminhoesComFlag);
  } catch (error) {
    console.error("Erro ao buscar caminhões:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar caminhões." },
      { status: 500 }
    );
  }
}