import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoBase64 from "@/lib/logo-base64-validado";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const acessos = await prisma.acesso.findMany({
      orderBy: { dataEntrada: "desc" },
    });

    const doc = new jsPDF();
    const agora = new Date().toLocaleString("pt-BR");

    // Logo e cabeçalho
    doc.addImage(logoBase64, "PNG", 10, 10, 60, 18);
    doc.setFontSize(16);
    doc.text("Relatório de Acessos", 10, 40);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${agora}`, 10, 46);

    let posY = 55;

    autoTable(doc, {
      startY: posY,
      head: [["Nome", "Documento", "Placa", "Empresa/Setor", "Solicitante", "Entrada", "Saída"]],
      body: acessos.map((a) => [
        a.nomePessoa,
        a.documentoPessoa,
        a.placaVeiculo || "-",
        a.empresaOuSetor || "-",
        a.pessoaSolicitante || "-",
        new Date(a.dataEntrada).toLocaleString("pt-BR"),
        a.dataSaida
          ? new Date(a.dataSaida).toLocaleString("pt-BR")
          : "Ainda no local",
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 84, 166], textColor: 255 },
    });

    const pdf = doc.output("arraybuffer");

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=relatorio-acessos.pdf",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF de acessos:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
