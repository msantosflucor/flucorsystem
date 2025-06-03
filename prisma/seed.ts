import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Criar caixas
  await prisma.caixa.createMany({
    data: [
      { nome: 'Caixa 01', status: 'livre', tipoResiduo: 'Diversos' },
      { nome: 'Caixa 02', status: 'livre', tipoResiduo: 'Diversos' },
      { nome: 'Caixa 03', status: 'livre', tipoResiduo: 'Oleoso' },
      { nome: 'Caixa 04', status: 'livre', tipoResiduo: 'Alcalino' },
      { nome: 'Caixa 05', status: 'livre', tipoResiduo: 'Acidos' },
      { nome: 'Caixa 06', status: 'livre', tipoResiduo: 'Lodo' },
    ],
    skipDuplicates: true,
  });

  console.log('Caixas cadastradas com sucesso!');

  // 2. Criar sysadmin
  const senhaHash = await bcrypt.hash("admin123", 10);

  await prisma.usuario.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      senhaHash,
      role: "SYSADMIN",
    },
  });

  console.log('Usuário admin criado com sucesso!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });