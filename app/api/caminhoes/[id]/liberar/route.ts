export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { registrarLog } from "@/lib/log-usuario";
import { getUsuarioAutenticado } from "@/lib/auth";

export async function PATCH(req: NextRequest, context: any) {
  const caminhaoId = Number(context.params.id);
  const { motivo } = await req.json();

  if (!caminhaoId || !motivo || motivo.trim() === "") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const usuario = await getUsuarioAutenticado(req);
    if (!usuario) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
    });

    if (!caminhao) {
      return NextResponse.json({ error: "Caminhão não encontrado." }, { status: 404 });
    }

    // Atualiza o status e registra como manual
    await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        status: "finalizado",
        manual: true, // ← IMPORTANTE
      },
    });

    // Registra a análise finalizada com motivo, tanque e observações
    await prisma.analise.create({
      data: {
        caminhaoId: caminhaoId,
        status: "finalizado",
        motivoLiberacaoSemDescarga: motivo,
        tanque: "liberação sem descarga",
        observacoes: "liberação sem descarregamento",
        criadoEm: new Date(),
      },
    });

    // Log de usuário
    await registrarLog({
      usuarioId: usuario.id,
      acao: `Liberou caminhão ${caminhao.placa} sem descarregar. Motivo: ${motivo}`,
      contexto: "Estacionamento",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao liberar caminhão:", error);
    return NextResponse.json({ error: "Erro interno ao processar liberação." }, { status: 500 });
  }
}