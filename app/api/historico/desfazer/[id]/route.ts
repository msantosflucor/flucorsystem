// app/api/historico/desfazer/[id]/route.ts
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
      return NextResponse.json(
        { error: "Senha obrigatória" }, 
        { status: 400 }
      );
    }

    const usuario = await getUsuarioAutenticado(req);
    if (!usuario?.id) {
      return NextResponse.json(
        { error: "Não autenticado" }, 
        { status: 401 }
      );
    }

    // CORREÇÃO AQUI: Mudar de 'senha' para 'senhaHash'
    const user = await prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: {
        id: true,
        senhaHash: true, // Campo corrigido
        role: true,
        username: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" }, 
        { status: 404 }
      );
    }

    if (user.role !== "SYSADMIN") {
      return NextResponse.json(
        { error: "Acesso negado. Requer perfil SYSADMIN" }, 
        { status: 403 }
      );
    }

    // CORREÇÃO AQUI: Verificar senhaHash em vez de senha
    if (!user.senhaHash) {
      return NextResponse.json(
        { error: "Nenhuma senha cadastrada para este usuário" }, 
        { status: 400 }
      );
    }

    // CORREÇÃO AQUI: Comparar com senhaHash
    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: "Senha incorreta" }, 
        { status: 401 }
      );
    }

    // Restante do código permanece igual...
    const caminhaoId = parseInt(params.id);
    if (isNaN(caminhaoId)) {
      return NextResponse.json(
        { error: "ID inválido" }, 
        { status: 400 }
      );
    }

    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
      include: { analises: { orderBy: { criadoEm: "desc" }, take: 1 } }
    });

    if (!caminhao) {
      return NextResponse.json(
        { error: "Caminhão não encontrado" }, 
        { status: 404 }
      );
    }

    const ultimaAnalise = caminhao.analises[0];
    const statusPermitidos = ["waiting", "approved", "incompatible", "in_progress"];
    const novoStatus = statusPermitidos.includes(ultimaAnalise?.status)
      ? ultimaAnalise.status
      : "waiting";

    const caminhaoAtualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        status: novoStatus,
        horaSaida: null,
        tempoLiberacaoMin: null,
        caixaId: null,
        destinoCaixaId: null,
        horaInicioCarregamento: null,
        horaFimCarregamento: null,
        origem: caminhao.origem || ultimaAnalise?.origem || null,
        tipo: caminhao.tipo || ultimaAnalise?.tipoResiduo || "Diversos",
      },
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
      }),
    });

    return NextResponse.json({
      success: true,
      caminhao: caminhaoAtualizado,
      liberadaIncompativel: ultimaAnalise?.liberadaIncompativel || false
    });

  } catch (error) {
    console.error("Erro ao desfazer finalização:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}