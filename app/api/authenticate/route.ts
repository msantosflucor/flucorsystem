// app/api/authenticate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido no ambiente");
}

// GET opcional só para você testar no navegador
export async function GET(req: Request) {
  return NextResponse.json({ ok: true, msg: "use POST para autenticar" }, { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    // 1) Descobrir se a requisição chegou por HTTPS (considerando proxy)
    const url = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const scheme = (forwardedProto ?? url.protocol.replace(":", "")).toLowerCase();
    const isSecure = scheme === "https";

    // 2) Validar corpo
    if (request.headers.get("content-type")?.includes("application/json") !== true) {
      return NextResponse.json({ error: "Content-Type deve ser application/json" }, { status: 415 });
    }
    const body = await request.json();
    const { username, senha } = body ?? {};

    if (!username || !senha) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
    }

    // 3) Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      include: { permissoes: { select: { modulo: true } } },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // 4) Validar senha
    if (!usuario.senhaHash) {
      return NextResponse.json({ error: "Usuário sem senha cadastrada." }, { status: 409 });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
    }

    // 5) Montar payload
    const permissoesArray = usuario.permissoes?.map((p: any) => p.modulo) ?? [];
    const payload = {
      id: usuario.id,
      username: usuario.username,
      role: usuario.role,
      permissoes: permissoesArray,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    // 6) Setar cookie corretamente (condicional por requisição)
    cookies().set("token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",      // se for domínios diferentes, troque para "none" e mantenha secure: true
      secure: isSecure,     // true só se entrou via HTTPS (considera x-forwarded-proto)
      maxAge: 60 * 60 * 8,  // 8h
      // domain: ".seu-dominio.com.br", // só se precisar compartilhar entre subdomínios
    });

    return NextResponse.json({ usuario: payload, token }, { status: 200 });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
