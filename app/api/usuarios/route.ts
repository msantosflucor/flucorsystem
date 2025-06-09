import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

// 🔐 Verificação segura via cookie + jose + logs
async function autenticarViaCookie(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.error("🚫 Nenhum token encontrado no cookie.");
    return null;
  }

  try {
    const { payload }: any = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    // ✅ Token válido - log removido para evitar excesso
    return payload?.role === "SYSADMIN" ? payload : null;
  } catch (error) {
    console.error("🛑 Token inválido ou expirado:", error);
    console.error("🔍 Token recebido:", token);
    return null;
  }
}

// ✅ POST - Criar novo usuário
export async function POST(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin)
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

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

    return NextResponse.json({ usuario: novoUsuario }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Erro no POST /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar usuário." },
      { status: 500 }
    );
  }
}

// ✅ GET - Listar usuários
export async function GET(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin)
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const usuarios = await prisma.usuario.findMany({
      include: { permissoes: true },
      orderBy: { username: "asc" },
    });

    const formatado = usuarios.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      permissoes: u.permissoes.map((p) => p.modulo),
    }));

    return NextResponse.json({ usuarios: formatado });
  } catch (error) {
    console.error("❌ Erro no GET /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar usuários." },
      { status: 500 }
    );
  }
}

// ✅ PATCH - Atualizar permissões de usuário
export async function PATCH(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin)
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const { id, modulos } = await req.json();
    if (!id || !Array.isArray(modulos)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    await prisma.permissao.deleteMany({ where: { usuarioId: id } });

    await prisma.permissao.createMany({
      data: modulos.map((modulo: string) => ({
        usuarioId: id,
        modulo,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Erro no PATCH /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar permissões." },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Excluir usuário
export async function DELETE(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin)
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });

    await prisma.permissao.deleteMany({ where: { usuarioId: id } });
    await prisma.usuario.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Erro no DELETE /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro ao excluir usuário." },
      { status: 500 }
    );
  }
}
