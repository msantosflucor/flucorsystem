import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { registrarLog } from "@/lib/log-usuario";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const TARGET = 50;
const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

// GET - Listar linhas com dados de caixas, carga e eficiência
export async function GET() {
  try {
    const linhas = await prisma.linha.findMany({
      include: { caixas: true },
      orderBy: { nome: "asc" },
    });

    const linhasFormatadas = await Promise.all(
      linhas.map(async (linha) => {
        const caixasIds = linha.caixas.map((caixa) => caixa.id);

        const totalProcessado = await prisma.caminhao.count({
          where: {
            caixaId: { in: caixasIds },
          },
        });

        const carga = Math.min(Math.round((totalProcessado / TARGET) * 100), 100);
        const eficiencia = Math.max(100 - carga, 0);

        return {
          id: linha.id,
          nome: linha.nome,
          status: linha.status,
          motivoManutencao: linha.motivoManutencao,
          tempoMedio: linha.tempoMedio,
          tipo: linha.tipo,
          ultimaManutencao: linha.ultimaManutencao,
          criadoEm: linha.criadoEm,
          totalProcessado,
          cargaAtual: carga,
          eficiencia,
          caixas: linha.caixas.map((caixa) => ({
            id: caixa.id,
            nome: caixa.nome,
            status: caixa.status,
            tipoResiduo: caixa.tipoResiduo,
          })),
        };
      })
    );

    return NextResponse.json(linhasFormatadas);
  } catch (error) {
    console.error("Erro ao buscar linhas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar linhas." },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status da linha (manutenção ou ativo)
export async function PATCH(req: Request) {
  try {
    const { id, status, motivoManutencao } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID e status são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ Identificar usuário logado via token
    let usuarioId = null;
    let autor = "Desconhecido";

    try {
      const token = cookies().get("token")?.value;
      if (token) {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        usuarioId = payload.id as number;
        autor = payload.username as string;
      }
    } catch (err) {
      console.warn("Falha ao identificar usuário para log");
    }

    const linhaAtualizada = await prisma.linha.update({
      where: { id },
      data: {
        status,
        motivoManutencao: status === "maintenance" ? motivoManutencao : null,
        cargaAtual: status === "maintenance" ? 0 : undefined,
      },
      include: { caixas: true },
    });

    // ✅ Se for colocada em manutenção, registra nova entrada e log
    if (status === "maintenance" && motivoManutencao?.trim()) {
      await prisma.manutencaoLinha.create({
        data: {
          linhaId: id,
          motivo: motivoManutencao,
        },
      });

      await registrarLog(
        `Colocou a linha "${linhaAtualizada.nome}" em manutenção`,
        "LINHAS",
        usuarioId
      );
    }

    // ✅ Se for reativada, finaliza o registro aberto e registra log
    if (status === "active") {
      await prisma.manutencaoLinha.updateMany({
        where: {
          linhaId: id,
          finalizadoEm: null,
        },
        data: {
          finalizadoEm: new Date(),
        },
      });

      await registrarLog(
        `Retirou a linha "${linhaAtualizada.nome}" da manutenção`,
        "LINHAS",
        usuarioId
      );
    }

    const caixasIds = linhaAtualizada.caixas.map((caixa) => caixa.id);

    const totalProcessado = await prisma.caminhao.count({
      where: {
        caixaId: { in: caixasIds },
      },
    });

    const carga = Math.min(Math.round((totalProcessado / TARGET) * 100), 100);
    const eficiencia = Math.max(100 - carga, 0);

    const linhaFormatada = {
      id: linhaAtualizada.id,
      nome: linhaAtualizada.nome,
      status: linhaAtualizada.status,
      motivoManutencao: linhaAtualizada.motivoManutencao,
      tempoMedio: linhaAtualizada.tempoMedio,
      tipo: linhaAtualizada.tipo,
      ultimaManutencao: linhaAtualizada.ultimaManutencao,
      criadoEm: linhaAtualizada.criadoEm,
      totalProcessado,
      cargaAtual: carga,
      eficiencia,
      caixas: linhaAtualizada.caixas.map((caixa) => ({
        id: caixa.id,
        nome: caixa.nome,
        status: caixa.status,
        tipoResiduo: caixa.tipoResiduo,
      })),
    };

    return NextResponse.json(linhaFormatada);
  } catch (error) {
    console.error("Erro ao atualizar linha:", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar linha." },
      { status: 500 }
    );
  }
}