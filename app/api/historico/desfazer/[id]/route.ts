import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAutenticado } from "@/lib/auth";
import { registrarLog } from "@/lib/log-usuario";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { senha } = await req.json();
    if (!senha) {
      return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });
    }

    const usuario = await getUsuarioAutenticado(req);
    if (!usuario?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: { id: true, senhaHash: true, role: true, username: true }
    });

    if (!user || user.role !== "SYSADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (!user.senhaHash || !(await bcrypt.compare(senha, user.senhaHash))) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const caminhaoId = parseInt(params.id);
    if (isNaN(caminhaoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
      include: {
        analises: { orderBy: { criadoEm: "desc" } }
      }
    });

    if (!caminhao) {
      return NextResponse.json({ error: "Caminhão não encontrado" }, { status: 404 });
    }

    // Recupera status anterior (última análise válida)
    const ultimaAnaliseValida = caminhao.analises.find(a => a.status !== "finalizado");
    const novoStatus = ultimaAnaliseValida ? ultimaAnaliseValida.status : "waiting";

    const caminhaoAtualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        status: novoStatus,
        horaSaida: null,
        tempoLiberacaoMin: null,
        horaInicioCarregamento: null,
        horaFimCarregamento: null,
        // Desconecta relações
        caixa: { disconnect: true },
        destinoCaixa: { disconnect: true }
      },
      include: {
        analises: { orderBy: { criadoEm: "desc" } }
      }
    });

    await registrarLog({
      usuarioId: user.id,
      autor: user.username,
      acao: `Desfez a finalização do caminhão ${caminhao.placa}`,
      contexto: "Histórico de Caminhões",
      detalhes: JSON.stringify({
        caminhaoId: caminhao.id,
        placa: caminhao.placa,
        statusAnterior: caminhao.status,
        statusNovo: caminhaoAtualizado.status
      })
    });

    return NextResponse.json({ success: true, caminhao: caminhaoAtualizado });

  } catch (error) {
    console.error("Erro ao desfazer finalização:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
