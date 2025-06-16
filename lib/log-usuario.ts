import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

export async function registrarLog(acao: string, contexto: string, usuarioId?: number) {
  try {
    let autor = "Desconhecido";
    let resolvedUserId = usuarioId || null;

    const token = cookies().get("token")?.value;
    if (token) {
      const { payload }: any = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      autor = payload.username || payload.sub || "Sem nome";

      if (!resolvedUserId && payload.id) {
        resolvedUserId = parseInt(payload.id);
      }
    }

    await prisma.logUsuario.create({
      data: {
        acao,
        contexto,            // ✅ substitui "modulo"
        autor,
        usuarioId: resolvedUserId,
        criadoEm: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao registrar log:", error);
  }
}