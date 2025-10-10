import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

/**
 * Registra um log de ação do usuário no banco de dados.
 * Pode ser usado diretamente ou via log-usuario-ext.ts para resolver JWT automaticamente.
 */
export async function registrarLog({
  usuarioId,
  autor,
  acao,
  contexto,
  detalhes,
}: {
  usuarioId?: number;
  autor?: string;
  acao: string;
  contexto: string;
  detalhes?: string;
}) {
  try {
    let resolvedAutor = autor || "Desconhecido";
    let resolvedUserId = usuarioId || null;

    // Se autor não foi passado, tenta resolver via token
    if (!autor) {
      const token = cookies().get("token")?.value;
      if (token) {
        const { payload }: any = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        resolvedAutor = payload.username || payload.sub || "Sem nome";
        if (!resolvedUserId && payload.id) {
          resolvedUserId = parseInt(payload.id);
        }
      }
    }

    await prisma.logUsuario.create({
      data: {
        acao,
        contexto,
        detalhes,
        autor: resolvedAutor,
        usuarioId: resolvedUserId,
        criadoEm: new Date(),
      },
    });
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
}