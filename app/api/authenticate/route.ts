import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_segura";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { username, senha } = body;

    if (!username || !senha) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { username },
      include: { permissoes: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    const payload = {
      id: usuario.id,
      username: usuario.username,
      role: usuario.role,
      permissoes: usuario.permissoes.map((p) => p.modulo),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    // Define cookie corretamente
    cookies().set("token", token, {
      httpOnly: true,
      secure: false, // importante para ambiente localhost
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({
      usuario: payload,
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}