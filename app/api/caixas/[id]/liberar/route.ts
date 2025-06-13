export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { registrarLog } from "@/lib/log-usuario";

export async function PATCH(request: NextRequest, context: any) {
  try {
    const id = context?.params?.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID da caixa inválido." }, { status: 400 });
    }

    const caixaId = Number(id);
    const { confirmar } = await request.json().catch(() => ({ confirmar: null }));

    const caminhaoAtual = await prisma.caminhao.findFirst({
      where: { caixaId },
    });

    if (caminhaoAtual) {
      await prisma.caminhao.update({
        where: { id: caminhaoAtual.id },
        data: {
          status: "finalizado",
          caixaId: null,
          // ❌ REMOVIDO: horaSaida será registrada somente pelo botão no histórico
        },
      });

      const analiseExistente = await prisma.analise.findFirst({
        where: { caminhaoId: caminhaoAtual.id },
      });

      if (analiseExistente) {
        await prisma.analise.update({
          where: { id: analiseExistente.id },
          data: {
            status: "finalizado",
            tanque: analiseExistente.tanque || "N/D",
            observacoes: analiseExistente.observacoes || "Encerrado automaticamente ao liberar a caixa.",
          },
        });
      } else {
        await prisma.analise.create({
          data: {
            caminhaoId: caminhaoAtual.id,
            status: "finalizado",
            tanque: "N/D",
            observacoes: "Encerrado automaticamente ao liberar a caixa.",
          },
        });
      }

      await registrarLog(
        `Finalizou caminhão ${caminhaoAtual.placa || caminhaoAtual.id} ao liberar a caixa`,
        "Caixas"
      );
    }

    const proximo = await prisma.caminhao.findFirst({
      where: {
        destinoCaixaId: caixaId,
        status: { in: ["in_progress", "approved"] },
      },
      orderBy: { criadoEm: "asc" },
    });

    if (proximo) {
      if (confirmar === true) {
        await prisma.caminhao.update({
          where: { id: proximo.id },
          data: {
            caixaId,
            destinoCaixaId: null,
          },
        });

        await prisma.caixa.update({
          where: { id: caixaId },
          data: { status: "ocupada" },
        });

        await registrarLog(
          `Puxou automaticamente caminhão ${proximo.placa || proximo.id} para a caixa`,
          "Caixas"
        );

        return NextResponse.json({
          message: `Caminhão ${proximo.placa || proximo.id} movido automaticamente para a caixa.`,
          proximo: null,
        });
      }

      if (confirmar === false) {
        await prisma.caixa.update({
          where: { id: caixaId },
          data: { status: "livre" },
        });

        return NextResponse.json({
          message: `Caixa liberada. Há caminhão disponível aguardando confirmação.`,
          proximo: {
            id: proximo.id,
            placa: proximo.placa,
            origem: proximo.origem,
          },
        });
      }

      return NextResponse.json({
        message: `Caminhão finalizado. Há um próximo disponível para ser puxado.`,
        proximo: {
          id: proximo.id,
          placa: proximo.placa,
          origem: proximo.origem,
        },
      });
    }

    await prisma.caixa.update({
      where: { id: caixaId },
      data: { status: "livre" },
    });

    return NextResponse.json({
      message: `Caminhão finalizado. Nenhum próximo disponível. Caixa liberada.`,
      proximo: null,
    });
  } catch (error) {
    console.error("Erro ao liberar a caixa:", error);
    return NextResponse.json(
      { error: "Erro interno ao liberar a caixa." },
      { status: 500 }
    );
  }
}