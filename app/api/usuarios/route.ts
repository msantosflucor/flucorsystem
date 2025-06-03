import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

// 🔐 Middleware para validar token e role
async function autenticar(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload: any = jwt.verify(token, JWT_SECRET);
    return payload.role === "SYSADMIN" ? payload : null;
  } catch {
    return null;
  }
}

// ✅ POST - Criar novo usuário
export async function POST(req: NextRequest) {
  const admin = await autenticar(req);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { username, senha, modulos } = await req.json();
  if (!username || !senha || !Array.isArray(modulos)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const novoUsuario = await prisma.usuario.create({
    data: {
      username,
      senhaHash,
      role: "PADRAO",
      permissoes: {
        create: modulos.map((modulo: string) => ({ modulo })),
      },
    },
  });

  return NextResponse.json({ usuario: novoUsuario });
}

// ✅ GET - Listar todos os usuários com permissões
export async function GET(req: NextRequest) {
  const admin = await autenticar(req);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const usuarios = await prisma.usuario.findMany({
    include: {
      permissoes: true,
    },
    orderBy: { username: "asc" },
  });

  const formatado = usuarios.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    permissoes: u.permissoes.map((p) => p.modulo),
  }));

  return NextResponse.json({ usuarios: formatado });
}

// ✅ PATCH - Atualizar permissões de um usuário
export async function PATCH(req: NextRequest) {
  const admin = await autenticar(req);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id, modulos } = await req.json();
  if (!id || !Array.isArray(modulos)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Apagar permissões antigas
  await prisma.permissao.deleteMany({
    where: { usuarioId: id },
  });

  // Criar novas permissões
  await prisma.permissao.createMany({
    data: modulos.map((modulo: string) => ({
      usuarioId: id,
      modulo,
    })),
  });

  return NextResponse.json({ ok: true });
}

// ✅ DELETE - Excluir usuário
export async function DELETE(req: NextRequest) {
  const admin = await autenticar(req);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });

  await prisma.permissao.deleteMany({ where: { usuarioId: id } });
  await prisma.usuario.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}