import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { StatusCaminhao } from "@prisma/client";
import { registrarLog } from "@/lib/log-usuario";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { isLaboratorioFechado } from "@/lib/horarioLab";

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

// GET - Listar caminhões separados por período de criação (estável)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const para = url.searchParams.get("para"); // "poshorario" | "laboratorio" | null
    const debug = url.searchParams.get("debug"); // "1" habilita debug

    // Campos e relações que você já usava
    const baseInclude = {
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
          responsavelLiberacao: true,
          liberadaIncompativel: true,
          justificativaLiberacaoIncompativel: true,
        },
      },
    };

    // 1) Busca só os caminhões não finalizados (do jeitinho que já estava)
    const base = await prisma.caminhao.findMany({
      where: { status: { not: StatusCaminhao.finalizado } },
      orderBy: { criadoEm: "desc" },
      take: 200,
      include: baseInclude,
    });

    // 2) Classificação **congelada** por data de criação
    //    Se foi criado numa janela em que o lab estava fechado, ele é "poshorario" para sempre.
    const classifica = (c: any) => {
      const dt = new Date(c.criadoEm);
      return isLaboratorioFechado(dt) ? "poshorario" : "laboratorio";
    };

    // 3) Filtra conforme o parâmetro "para"
    let caminhoesFiltrados = base;
    if (para === "poshorario") {
      caminhoesFiltrados = base.filter((c) => classifica(c) === "poshorario");
    } else if (para === "laboratorio") {
      caminhoesFiltrados = base.filter((c) => classifica(c) === "laboratorio");
    }
    // Se "para" for nulo, retorna ambos (útil pra telas gerais/diagnóstico)

    // 4) Flag de liberadaIncompativel + bloco de debug opcional
    const agora = new Date().toISOString();
    const caminhoesComFlag = caminhoesFiltrados.map((c) => {
      const liberada = c.analises?.some(
        (a: any) => a.liberadaIncompativel && !!a.justificativaLiberacaoIncompativel
      );

      const baseObj = {
        ...c,
        liberadaIncompativel: !!liberada,
      };

      if (debug === "1") {
        return Object.assign(baseObj, {
          _debug: {
            classificadoComo: classifica(c),
            horarioAtual: agora,
            criadoEm: new Date(c.criadoEm).toISOString(),
            possuiAnalises: c.analises?.length > 0,
          },
        });
      }

      return baseObj;
    });

    return NextResponse.json(caminhoesComFlag);
  } catch (error) {
    console.error("❌ [API Caminhões] Erro ao buscar caminhões:", error);
    return NextResponse.json({ error: "Erro interno ao buscar caminhões." }, { status: 500 });
  }
}