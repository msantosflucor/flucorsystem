// scripts/fix-admin-permissions.ts
import { prisma } from "@/lib/prisma";

async function fixAdminPermissions() {
  try {
    // Buscar o usuário admin
    const admin = await prisma.usuario.findUnique({
      where: { username: "admin" },
      include: { permissoes: true }
    });

    if (!admin) {
      console.log("❌ Usuário admin não encontrado!");
      return;
    }


    // Lista de todos os módulos disponíveis
    const todosModulos = [
      "DASHBOARD", "LABORATORIO", "HISTORICO", "ESTACIONAMENTO", 
      "LINHAS", "CAIXAS", "CAMINHAO", "ACESSO", "POSHORARIO", "USUARIOS"
    ];

    // Remover permissões existentes (para recriar)
    await prisma.permissao.deleteMany({
      where: { usuarioId: admin.id }
    });

    // Criar todas as permissões para o admin
    const novasPermissoes = await Promise.all(
      todosModulos.map(modulo => 
        prisma.permissao.create({
          data: {
            usuarioId: admin.id,
            modulo: modulo as any
          }
        })
      )
    );


  } catch (error) {
    console.error("❌ Erro ao corrigir permissões:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions();