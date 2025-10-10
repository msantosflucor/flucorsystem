import { registrarLog } from "@/lib/log-usuario";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

/**
 * Função auxiliar para registrar log com autenticação automática via JWT no cookie.
 * Resolve o usuário automaticamente, e chama registrarLog com autor, acao, contexto e detalhes.
 */
export async function registrarLogComUsuario({
  acao,
  contexto,
  detalhes,
}: {
  acao: string;
  contexto: string;
  detalhes?: string;
}) {
  if (!acao || !contexto) {
    console.error("❌ registrarLogComUsuario requer 'acao' e 'contexto'. Um dos dois está ausente.");
    return;
  }

  const cookiesStore = cookies();
  const token = cookiesStore.get("token")?.value;

  let usuarioId: number | null = null;
  let autor = "Desconhecido";

  if (token) {
    try {
      const { payload }: any = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      usuarioId = payload.id as number;
      autor = payload.username || payload.sub || "Sem nome";
    } catch (error) {
      console.error("❌ Erro ao verificar JWT ao registrar log:", error);
    }
  }

  try {
    await registrarLog({
      usuarioId,
      autor,
      acao,
      contexto,
      detalhes,
    });
  } catch (error) {
    console.error("❌ Erro ao registrar log:", error);
  }
}