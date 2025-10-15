import { NextRequest, NextResponse } from "next/server";
import { isLaboratorioFechado, janelaFechamentoAtual } from "@/lib/horarioLab";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const forcar = url.searchParams.get("forcar"); // "fechado" | "aberto" | null

  const fechado = forcar === "fechado" ? true : forcar === "aberto" ? false : isLaboratorioFechado();
  const [inicio, fim] = janelaFechamentoAtual();

  return NextResponse.json({
    fechado,
    janela: inicio && fim ? { inicio, fim } : null
  });
}
