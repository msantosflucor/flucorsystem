import { NextResponse } from "next/server";
// Ajuste este import conforme seu projeto.
// Se você usa um client compartilhado, deixe como "@/lib/prisma".
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Body esperado:
// { lacre: string; descricao?: string | null; finalizar?: boolean }
//
// - lacre: obrigatório (será trimado e uppercased).
// - descricao: opcional.
// - finalizar: opcional (default false). Se true -> status = "finalizado" e horaSaida = now().

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caminhaoId = Number(params.id);
    if (!Number.isFinite(caminhaoId) || caminhaoId <= 0) {
      return NextResponse.json(
        { error: "ID do caminhão inválido." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const lacreRaw: unknown = body?.lacre;
    const descricaoRaw: unknown = body?.descricao;
    const finalizar: boolean = Boolean(body?.finalizar); // default false

    if (typeof lacreRaw !== "string" || !lacreRaw.trim()) {
      return NextResponse.json(
        { error: "Campo 'lacre' é obrigatório." },
        { status: 400 }
      );
    }

    const lacre = lacreRaw.trim().toUpperCase();
    const descricao =
      typeof descricaoRaw === "string" && descricaoRaw.trim()
        ? descricaoRaw.trim()
        : null;

    // garante que o caminhão existe
    const existe = await prisma.caminhao.findUnique({
      where: { id: caminhaoId },
      select: { id: true, horaFimCarregamento: true },
    });

    if (!existe) {
      return NextResponse.json(
        { error: "Caminhão não encontrado." },
        { status: 404 }
      );
    }

    // (Opcional) Se quiser forçar que só pode pós-analisar após terminar o carregamento:
    // if (!existe.horaFimCarregamento) {
    //   return NextResponse.json(
    //     { error: "Carregamento ainda não foi finalizado para este caminhão." },
    //     { status: 409 }
    //   );
    // }

    // monta o payload de update
    const data: any = {
      lacreCaminhao: lacre,
      posAnaliseDescricao: descricao,
      posAnaliseEm: new Date(),
    };

    if (finalizar) {
      data.status = "finalizado"; // enum StatusCaminhao
      data.horaSaida = new Date();
    }

    const atualizado = await prisma.caminhao.update({
      where: { id: caminhaoId },
      data,
      include: {
        analises: {
          orderBy: { criadoEm: "desc" },
        },
        caixa: true,
        destinoCaixa: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Pós-análise registrada com sucesso.",
        caminhao: atualizado,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Erro em pos-analise-carregamento:", err);
    return NextResponse.json(
      { error: "Falha ao registrar a pós-análise." },
      { status: 500 }
    );
  }
}
