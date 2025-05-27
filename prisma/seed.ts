import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.caixa.createMany({
    data: [
      { nome: 'Caixa 01', status: 'livre', tipoResiduo: 'Diversos' },
      { nome: 'Caixa 02', status: 'livre', tipoResiduo: 'Diversos' },
      { nome: 'Caixa 03', status: 'livre', tipoResiduo: 'Oleoso' },
      { nome: 'Caixa 04', status: 'livre', tipoResiduo: 'Alcalino' },
      { nome: 'Caixa 05', status: 'livre', tipoResiduo: 'Ácido' },
      { nome: 'Caixa 06', status: 'livre', tipoResiduo: 'Lodo' },
    ],
  });

  console.log('Caixas cadastradas com sucesso!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });