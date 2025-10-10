import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const linhas = [
      { nome: "Linha 1", tipo: "Diversos" },
      { nome: "Linha 2", tipo: "Diversos" },
      { nome: "Linha 3", tipo: "Oleoso" },
      { nome: "Linha 4", tipo: "Alcalino" },
      { nome: "Linha 5", tipo: "Ácido" },
      { nome: "Linha 6", tipo: "Lodo" },
    ]

    for (const linha of linhas) {
      await prisma.linha.create({
        data: {
          nome: linha.nome,
          tipo: linha.tipo,
          status: "active",
          tempoMedio: 30,
          totalProcessado: 0,
          eficiencia: 90,
          ultimaManutencao: new Date(),
          motivoManutencao: null,
          cargaAtual: 50,
        },
      })
    }

    return NextResponse.json({ message: "Linhas cadastradas com sucesso" })
  } catch (error) {
    console.error(error)
    return new NextResponse("Erro ao cadastrar linhas", { status: 500 })
  }
}