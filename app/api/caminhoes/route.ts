import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";
import { registrarLog } from "@/lib/log-usuario";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { isLaboratorioFechado, janelaFechamentoAtual } from "@/lib/horarioLab";

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

    let usuarioId: number | null = null;
    let autor = "Desconhecido";

    if (token) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      usuarioId = payload.id as number;
      autor = payload.username as string;
    }

    // (1) Cria o caminhão
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
        origem: "portaria",
      },
    });

    // (2) GARANTIR ACESSO no Histórico (Controle de Acesso → Histórico)
    const acessoAberto = await prisma.acesso.findFirst({
      where: { caminhaoId: novoCaminhao.id, dataSaida: null },
      orderBy: { dataEntrada: "desc" },
      select: { id: true },
    });

    if (!acessoAberto) {
      await prisma.acesso.create({
        data: {
          caminhaoId: novoCaminhao.id,
          placaVeiculo: novoCaminhao.placa,
          empresaOuSetor: novoCaminhao.transportadora ?? "Transportadora",
          nomePessoa: novoCaminhao.motorista ?? "—",
          documentoPessoa: novoCaminhao.documentoMotorista ?? "—",
          dataEntrada: new Date(),
        },
      });
    }

    // (3) Log
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
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const para = url.searchParams.get("para"); // "poshorario" | "laboratorio" | null

    // Base query
    let where: any = {
      status: { not: StatusCaminhao.finalizado } // Sempre exclui finalizados
    };

    // Se for para "poshorario", aplica filtro específico
    if (para === "poshorario") {
      // SEMPRE filtra pela janela de fechamento, independente do estado atual do laboratório
      const [inicio, fim] = janelaFechamentoAtual();
      if (inicio && fim) {
        where.criadoEm = { gte: inicio, lt: fim };
      } else {
        // Se não há janela ativa (laboratório aberto), retorna vazio
        return NextResponse.json([]);
      }
    } 
    // Se for para "laboratorio", busca apenas caminhões fora da janela de fechamento
    else if (para === "laboratorio") {
      const [inicio, fim] = janelaFechamentoAtual();
      if (inicio && fim) {
        // Exclui caminhões criados durante o fechamento do laboratório
        where.criadoEm = { not: { gte: inicio, lt: fim } };
      }
      // Se não há janela ativa, busca todos (laboratório aberto normal)
    }
    // Se não especificado (null), busca todos os caminhões não finalizados

    const caminhoes = await prisma.caminhao.findMany({
      where,
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
      take: 100, // Limite para performance
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