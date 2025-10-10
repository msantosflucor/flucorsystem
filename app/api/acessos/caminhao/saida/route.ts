import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { caminhaoId } = await req.json() as { caminhaoId?: number };
    if (!caminhaoId) {
      return NextResponse.json({ error: "caminhaoId é obrigatório" }, { status: 400 });
    }

    const now = new Date();

    const acesso = await prisma.acesso.findFirst({
      where: { caminhaoId, dataSaida: null },
      orderBy: { dataEntrada: "desc" },
    });

    const acessoGarantido = acesso ?? await prisma.acesso.create({
      data: {
        caminhaoId,
        nomePessoa: "—",
        documentoPessoa: "—",
        placaVeiculo: (await prisma.caminhao.findUnique({ where: { id: caminhaoId } }))?.placa,
        empresaOuSetor: (await prisma.caminhao.findUnique({ where: { id: caminhaoId } }))?.transportadora ?? "Transportadora",
        dataEntrada: now,
      },
    });

    const [acessoFechado] = await prisma.$transaction([
      prisma.acesso.update({ where: { id: acessoGarantido.id }, data: { dataSaida: now } }),
      prisma.caminhao.update({ where: { id: caminhaoId }, data: { horaSaida: now } }),
    ]);

    const duracaoMin = Math.max(0, Math.round((acessoFechado.dataSaida!.getTime() - acessoFechado.dataEntrada.getTime()) / 60000));
    return NextResponse.json({ ok: true, duracaoMin }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Falha ao registrar saída do caminhão" }, { status: 500 });
  }
}