import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { status, observations } = await req.json()

  if (!status) {
    return new NextResponse("Status obrigatório", { status: 400 })
  }

  try {
    const updated = await prisma.Analise.update({
      where: { id: Number(params.id) },
      data: {
        status,
        observacoes: observations ?? "",
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error("Erro ao atualizar análise:", err)
    return new NextResponse("Erro interno", { status: 500 })
  }
}