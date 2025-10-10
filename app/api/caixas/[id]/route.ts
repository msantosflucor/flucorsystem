export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar dados da caixa por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsedId = parseInt(params.id);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const caixa = await prisma.caixa.findUnique({
      where: { id: parsedId },
      include: {
        linha: true,
        caminhoes: {
          where: { status: { in: ["waiting", "in_progress"] } },
          orderBy: { criadoEm: "desc" },
          take: 1,
        },
      },
    });

    if (!caixa) {
      return NextResponse.json({ error: "Caixa não encontrada." }, { status: 404 });
    }

    const resultado = {
      id: caixa.id,
      nome: caixa.nome,
      status: caixa.status,
      tipoResiduo: caixa.tipoResiduo,
      linha: caixa.linha
        ? { id: caixa.linha.id, nome: caixa.linha.nome }
        : null,
      criadoEm: caixa.criadoEm,
      caminhaoId: caixa.caminhoes[0]?.id || null,
      caminhaoPlaca: caixa.caminhoes[0]?.placa || null,
    };

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar caixa:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// PATCH - Liberar ou ocupar caixa e movimentar caminhões
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsedId = parseInt(params.id);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const { status } = await req.json();

    if (!status || !["livre", "ocupada"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido. Use 'livre' ou 'ocupada'." },
        { status: 400 }
      );
    }

    const caixa = await prisma.caixa.findUnique({
      where: { id: parsedId },
      include: {
        caminhoes: {
          where: { status: "waiting" },
          orderBy: { criadoEm: "desc" },
          take: 1,
        },
      },
    });

    if (!caixa) {
      return NextResponse.json({ error: "Caixa não encontrada." }, { status: 404 });
    }

    // Se for liberar a caixa:
    if (status === "livre") {
      // Verificar se há caminhão na caixa
      const caminhaoNaCaixa = await prisma.caminhao.findFirst({
        where: {
          caixaId: parsedId,
          status: "waiting",
        },
      });

      if (caminhaoNaCaixa) {
        // Atualizar caminhão para finalizado
        await prisma.caminhao.update({
          where: { id: caminhaoNaCaixa.id },
          data: {
            status: "finalizado",
            caixaId: null,
          },
        });
      }

      // Atualiza caixa para livre
      await prisma.caixa.update({
        where: { id: parsedId },
        data: { status: "livre" },
      });

      return NextResponse.json({ message: "Caixa liberada com sucesso." });
    }

    // Se for ocupar a caixa:
    if (status === "ocupada") {
      // Verificar se há caminhão no estacionamento destinado a essa caixa
      const caminhaoNoPatio = await prisma.caminhao.findFirst({
        where: {
          status: "in_progress",
          destinoCaixaId: parsedId,
        },
        orderBy: { criadoEm: "asc" },
      });

      if (!caminhaoNoPatio) {
        return NextResponse.json(
          { message: "Caixa ocupada. Nenhum caminhão disponível no pátio." },
          { status: 200 }
        );
      }

      // Atualiza caminhão para waiting na caixa
      await prisma.caminhao.update({
        where: { id: caminhaoNoPatio.id },
        data: {
          status: "waiting",
          caixaId: parsedId,
        },
      });

      // Atualiza status da caixa
      await prisma.caixa.update({
        where: { id: parsedId },
        data: { status: "ocupada" },
      });

      return NextResponse.json({
        message: `Caminhão ${caminhaoNoPatio.placa} movido para a caixa.`,
      });
    }

    return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  } catch (error) {
    console.error("Erro ao atualizar caixa:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// DELETE - Remover caixa
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsedId = parseInt(params.id);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await prisma.caixa.delete({
      where: { id: parsedId },
    });

    return NextResponse.json({ message: "Caixa deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar caixa:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}