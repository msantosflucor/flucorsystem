import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chave_fallback_insegura";

// SYSADMIN ou LOGISTICA
async function autenticarViaCookie(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const { payload }: any = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    return ["SYSADMIN", "LOGISTICA"].includes(payload?.role) ? payload : null;
  } catch (error) {
    console.error("Token inválido:", error);
    return null;
  }
}

// POST - Criar novo usuário
export async function POST(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin)
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const { username, senha, modulos, email, documento, role } = await req.json();

    if (!username || !senha || !Array.isArray(modulos)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const jaExiste = await prisma.usuario.findUnique({ where: { username } });
    if (jaExiste) {
      return NextResponse.json(
        { error: "Nome de usuário já cadastrado." },
        { status: 409 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: {
        username,
        senhaHash,
        email,
        documento,
        role: role || "PADRAO",
        permissoes: {
          create: modulos.map((modulo: string) => ({ modulo })),
        },
      },
    });

    await prisma.logUsuario.create({
      data: {
        usuarioId: novoUsuario.id,
        acao: "CRIACAO",
        autor: admin.username,
        detalhes: `Usuário '${username}' criado com role ${role}`,
      },
    });

    return NextResponse.json({ usuario: novoUsuario }, { status: 201 });
  } catch (error) {
    console.error("Erro no POST /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar usuário." },
      { status: 500 }
    );
  }
}

// GET - Listar usuários
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
      email: u.email,
      documento: u.documento,
      role: u.role,
      permissoes: u.permissoes.map((p) => p.modulo),
    }));

    return NextResponse.json({ usuarios: formatado });
  } catch (error) {
    console.error("Erro no GET /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar usuários." },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar dados e permissões de usuário
export async function PATCH(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin)
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const { id, username, email, documento, role, modulos, novaSenha } =
      await req.json();

    if (!id || !Array.isArray(modulos)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const updateData: any = {
      username,
      email,
      documento,
      role,
    };

    if (novaSenha && novaSenha.length >= 6) {
      updateData.senhaHash = await bcrypt.hash(novaSenha, 10);
    }

    await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    await prisma.permissao.deleteMany({ where: { usuarioId: id } });

    await prisma.permissao.createMany({
      data: modulos.map((modulo: string) => ({
        usuarioId: id,
        modulo,
      })),
    });

    await prisma.logUsuario.create({
      data: {
        usuarioId: id,
        acao: "EDICAO",
        autor: admin.username,
        detalhes: `Usuário '${username}' editado. Role: ${role}. Permissões: [${modulos.join(", ")}]`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no PATCH /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar dados do usuário." },
      { status: 500 }
    );
  }
}

// DELETE - Excluir usuário
export async function DELETE(req: NextRequest) {
  try {
    const admin = await autenticarViaCookie(req);
    if (!admin)
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });

    const usuario = await prisma.usuario.findUnique({ where: { id } });

    await prisma.permissao.deleteMany({ where: { usuarioId: id } });
    await prisma.usuario.delete({ where: { id } });

    await prisma.logUsuario.create({
      data: {
        usuarioId: id,
        acao: "EXCLUSAO",
        autor: admin.username,
        detalhes: `Usuário '${usuario?.username}' excluído do sistema`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no DELETE /api/usuarios:", error);
    return NextResponse.json(
      { error: "Erro ao excluir usuário." },
      { status: 500 }
    );
  }
}
