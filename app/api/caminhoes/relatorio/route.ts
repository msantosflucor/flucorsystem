import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import logoBase64 from "@/lib/logo-base64-validado";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const caminhões = await prisma.caminhao.findMany({
      orderBy: { criadoEm: "desc" },
    });

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const agora = new Date().toLocaleString("pt-BR");

    // Logo e título
    doc.addImage(logoBase64, "PNG", 10, 10, 60, 18);
    doc.setFontSize(16);
    doc.setTextColor(33, 64, 154);
    doc.text("Relatório de Caminhões Registrados", 10, 40);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Gerado em: ${agora}`, 10, 46);

    const cardWidth = 90;
    const cardHeight = 52;
    const margin = 10;
    const spacing = 5;
    let x = margin;
    let y = 55;

    for (let i = 0; i < caminhões.length; i++) {
      const c = caminhões[i];

      if (x + cardWidth > pageWidth) {
        x = margin;
        y += cardHeight + spacing;
      }

      if (y + cardHeight > 287) {
        doc.addPage();
        y = 20;
      }

      const saida = c.horaSaida
        ? new Date(c.horaSaida).toLocaleString("pt-BR")
        : "Ainda na fábrica";

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 84, 166);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "FD");

      const textX = x + 3.5;
      let textY = y + 6;
      const lineSpacing = 4.2;

      const linhas = [
        ["Placa:", c.placa],
        ["Motorista:", c.motorista],
        ["Documento:", c.documentoMotorista],
        ["Transportadora:", c.transportadora],
        ["Entrada:", new Date(c.criadoEm).toLocaleString("pt-BR")],
        ["Saída:", saida],
        ["MTR / NF:", `${c.possuiMTR ? "Sim" : "Não"} / ${c.possuiNotaFiscal ? "Sim" : "Não"}`],
        ["EPI / Vestimenta:", `${c.possuiEPI ? "Sim" : "Não"} / ${c.vestimentaIrregular ? "Irregular" : "Ok"}`],
        ["Anomalia:", c.anomaliaVeiculo ? c.descricaoAnomalia : "Nenhuma"],
        ["Estado Físico:", c.estadoFisico || "Não informado"],
      ];

      doc.setFontSize(8.5);

      for (const [label, value] of linhas) {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}`, textX, textY);
        const labelWidth = doc.getTextWidth(label);
        doc.setFont("helvetica", "normal");
        doc.text(`${value}`, textX + labelWidth + 1.5, textY);
        textY += lineSpacing;
      }

      x += cardWidth + spacing;
    }

    const pdfBytes = doc.output("arraybuffer");
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="relatorio-caminhoes.pdf"',
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
  }
}