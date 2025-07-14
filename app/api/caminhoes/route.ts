import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";
import { registrarLog } from "@/lib/log-usuario";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

// POST - Cadastrar novo caminhão
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
      carregamento = false,
    } = await req.json();

    if (!placa || !motorista || !transportadora || !documentoMotorista) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }

    const cookiesStore = cookies();
    const token = cookiesStore.get("token")?.value;

    let usuarioId = null;
    let autor = "Desconhecido";

    if (token) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      usuarioId = payload.id as number;
      autor = payload.username as string;
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
        status: StatusCaminhao.waiting,
        criadoEm: new Date(),
        carregamento,
      },
    });

    await registrarLog({
      usuarioId,
      autor,
      acao: "Cadastrou caminhão",
      contexto: "Cadastro de Caminhões",
    });

    return NextResponse.json(novoCaminhao, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar caminhão:", error);
    return NextResponse.json({ error: "Erro interno ao salvar caminhão." }, { status: 500 });
  }
}

// GET - Listar todos os caminhões com análises
export async function GET() {
  try {
    const caminhoes = await prisma.caminhao.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        caixa: true,
        destinoCaixa: true,
        analises: {
          orderBy: { criadoEm: "desc" },
          select: {
            id: true,
            status: true,
            tanque: true,
            observacoes: true,
            criadoEm: true,
            tipoResiduo: true,
            destino: true,
            outroDestino: true,
            origem: true,
            liberadaIncompativel: true,
            justificativaLiberacaoIncompativel: true,
          },
        },
      },
    });

    // Apenas adiciona uma flag auxiliar fora da estrutura de analises
    const caminhoesComFlag = caminhoes.map((caminhao) => {
      const liberada = caminhao.analises.some(
        (a) => a.liberadaIncompativel && !!a.justificativaLiberacaoIncompativel
      );
      return {
        ...caminhao,
        liberadaIncompativel: liberada,
      };
    });

    return NextResponse.json(caminhoesComFlag);
  } catch (error) {
    console.error("Erro ao buscar caminhões:", error);
    return NextResponse.json({ error: "Erro interno ao buscar caminhões." }, { status: 500 });
  }
}
