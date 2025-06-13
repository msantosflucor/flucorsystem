import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_segura";

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("token")?.value;

    if (!cookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = jwt.verify(cookie, JWT_SECRET);
    return NextResponse.json({ user: decoded });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
