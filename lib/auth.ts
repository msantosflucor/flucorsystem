import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

export async function getUsuarioAutenticado(req: Request): Promise<{ id: number } | null> {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) return null;

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

    const userId = Number((payload as any).sub || (payload as any).id);
    if (isNaN(userId)) return null;

    return { id: userId };
  } catch {
    return null;
  }
}
