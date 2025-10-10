import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { registrarLogComUsuario } from "@/lib/log-usuario-ext"; // importa função de log

// POST - Registrar nova entrada
export async function POST(req: NextRequest) {
  try {
    const {
      nomePessoa,
      documentoPessoa,
      placaVeiculo,
      empresaOuSetor,
      pessoaSolicitante,
    } = await req.json();

    if (!nomePessoa || !documentoPessoa) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const novoAcesso = await prisma.acesso.create({
      data: {
        nomePessoa,
        documentoPessoa,
        placaVeiculo,
        empresaOuSetor,
        pessoaSolicitante,
      },
    });

    // Registrar log da ação
    const tipoAcesso = placaVeiculo ? "Veículo" : "Pedestre";
    await registrarLogComUsuario({
      acao: `Cadastro de acesso: ${tipoAcesso} - ${nomePessoa}`,
      contexto: "Controle de Acesso",
    });

    return NextResponse.json(novoAcesso, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar acesso:", error);
    return NextResponse.json(
      { error: "Erro interno ao registrar acesso." },
      { status: 500 }
    );
  }
}

// GET - Listar histórico de acessos
export async function GET() {
  try {
    const acessos = await prisma.acesso.findMany({
      orderBy: { dataEntrada: "desc" },
    });

    return NextResponse.json(acessos);
  } catch (error) {
    console.error("Erro ao buscar acessos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar acessos." },
      { status: 500 }
    );
  }
}
