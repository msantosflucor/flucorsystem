import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido no ambiente");
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { username, senha } = body;

    if (!username || !senha) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
    }

    // Buscar usuário no banco
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      include: {
        permissoes: {
          select: {
            modulo: true
          }
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Validar senha com bcrypt
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    // Preparar payload do token - garantir que permissoes seja um array de strings
    const permissoesArray = usuario.permissoes?.map((p) => p.modulo) || [];
    
    const payload = {
      id: usuario.id,
      username: usuario.username,
      role: usuario.role,
      permissoes: permissoesArray,
    };

    // DEBUG: Log para verificar o payload
    console.log("[AUTH] Login realizado:", {
      username: usuario.username,
      role: usuario.role,
      permissoes: permissoesArray
    });

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    // Definir cookie
    cookies().set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
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