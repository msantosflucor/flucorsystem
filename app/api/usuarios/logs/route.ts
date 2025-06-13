import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

async function autenticarViaCookie(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const { payload }: any = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    return payload?.role === "SYSADMIN" ? payload : null;
  } catch (error) {
    console.error("Token inválido:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const logs = await prisma.logUsuario.findMany({
      orderBy: { criadoEm: "desc" },
      take: 100,
    });

    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const usuario = log.usuarioId
          ? await prisma.usuario.findUnique({
              where: { id: log.usuarioId },
              select: { username: true },
            })
          : null;

        return {
          id: log.id,
          usuarioId: log.usuarioId,
          usuario: usuario?.username || null, // 🔄 aqui renomeado para compatibilidade
          autor: log.autor,
          acao: log.acao,
          detalhes: log.detalhes,
          criadoEm: log.criadoEm,
        };
      })
    );

    return NextResponse.json({ logs: enrichedLogs });
  } catch (error) {
    console.error("Erro ao buscar logs de usuários:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar logs." },
      { status: 500 }
    );
  }
}