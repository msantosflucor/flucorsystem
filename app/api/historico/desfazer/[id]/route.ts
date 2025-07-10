import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAutenticado } from "@/lib/auth";
import { registrarLog } from "@/lib/log-usuario";

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    console.log("Cookie recebido:", req.headers.get("cookie"));

    const usuario = await getUsuarioAutenticado(req);
    console.log("Usuário autenticado:", usuario);

    if (!usuario?.id) {
      console.error("Usuário não autenticado");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: usuario.id },
    });

    if (!user) {
      console.error("Usuário não encontrado no banco de dados");
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (user.role !== "SYSADMIN") {
      console.error("Acesso negado - Role:", user.role);
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const caminhaoId = Number(context.params.id);
    if (isNaN(caminhaoId)) {
      console.error("⚠ ID de caminhão inválido:", context.params.id);
      return NextResponse.json({ error: "ID de caminhão inválido." }, { status: 400 });
    }

    console.log("Buscando caminhão ID:", caminhaoId);
    const caminhao = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
      include: { analises: true },
    });

    if (!caminhao) {
      console.error("Caminhão não encontrado ID:", caminhaoId);
      return NextResponse.json({ error: "Caminhão não encontrado." }, { status: 404 });
    }

    if (caminhao.status !== "finalizado") {
      console.error("⚠ Caminhão não está finalizado - Status:", caminhao.status);
      return NextResponse.json(
        { error: "Caminhão não está finalizado." }, 
        { status: 400 }
      );
    }

    console.log("Atualizando caminhão ID:", caminhaoId);
    const caminhaoAtualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data: {
        status: "waiting",
        horaSaida: null,
        horaInicioCarregamento: null,
        horaFimCarregamento: null,
        caixaId: null,
        destinoCaixaId: null,
      },
    });

    console.log("Caminhão atualizado:", caminhaoAtualizado);

    // Registro de log com a nova assinatura
    await registrarLog({
      usuarioId: user.id,
      autor: user.username,
      acao: "Desfez a finalização do caminhão (placa ${caminhao.placa})",
      contexto: "Histórico de Caminhões",
      detalhes: JSON.stringify({
        caminhaoId: caminhao.id,
        placa: caminhao.placa,
        statusAnterior: caminhao.status,
        statusNovo: "waiting",
        usuario: user.username,
        data: new Date().toISOString()
      })
    });

    return NextResponse.json({ 
      sucesso: true, 
      caminhao: caminhaoAtualizado 
    });

  } catch (error) {
    console.error("Erro ao desfazer finalização:", error);
    return NextResponse.json(
      { error: "Erro interno ao desfazer finalização" }, 
      { status: 500 }
    );
  }
}