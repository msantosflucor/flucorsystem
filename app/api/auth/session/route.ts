import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_segura";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("token")?.value;

    if (!cookie) {
      // Sem token → 200 com user/expires nulos
      return NextResponse.json({ user: null, expires: null }, { status: 200 });
    }

    const decoded = jwt.verify(cookie, JWT_SECRET);
    return NextResponse.json({ user: decoded, expires: null }, { status: 200 });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    // Token inválido → também 200 com user null
    return NextResponse.json({ user: null, expires: null }, { status: 200 });
  }
}