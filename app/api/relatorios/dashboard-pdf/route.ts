import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoBase64 from "@/lib/logo-base64-validado";
import { prisma } from "@/lib/prisma";

// Tradução de status
const traduzirStatus = (status: string): string => {
  switch (status) {
    case "active":
      return "Ativo";
    case "maintenance":
      return "Em Manutenção";
    case "waiting":
      return "Aguardando";
    case "in_progress":
      return "Em Análise";
    case "finalizado":
      return "Finalizado";
    case "Liberado":
      return "Liberado";
    case "incompatible":
      return "Incompatível";
    default:
      return status;
  }
};

export async function GET() {
  try {
    const doc = new jsPDF();
    const agora = new Date().toLocaleString("pt-BR");

    // Logo e cabeçalho
    doc.addImage(logoBase64, "PNG", 10, 10, 60, 18);
    doc.setFontSize(16);
    doc.text("Relatório Geral de Controle - Flucor", 10, 40);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${agora}`, 10, 46);

    let posY = 55;

    // === Caixas
    const caixas = await prisma.caixa.findMany({ orderBy: { nome: "asc" } });

    autoTable(doc, {
      startY: posY,
      head: [["Caixa", "Status"]],
      body: caixas.map((c) => [
        { content: c.nome, styles: { fontStyle: "bold" } },
        traduzirStatus(c.status),
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 84, 166], textColor: 255 },
      didDrawPage: (d) => { posY = d.cursor.y + 10; },
    });

    // === Linhas
    const linhas = await prisma.linha.findMany({ orderBy: { nome: "asc" } });

    autoTable(doc, {
      startY: posY,
      head: [["Linha", "Status"]],
      body: linhas.map((l) => [
        { content: l.nome, styles: { fontStyle: "bold" } },
        traduzirStatus(l.status),
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 84, 166], textColor: 255 },
      didDrawPage: (d) => { posY = d.cursor.y + 10; },
    });

    // === Manutenções por linha
    for (const linha of linhas) {
      const manutencoes = await prisma.manutencaoLinha.findMany({
        where: { linhaId: linha.id },
        orderBy: { criadoEm: "desc" },
        take: 10,
      });

      if (manutencoes.length > 0) {
        autoTable(doc, {
          startY: posY,
          head: [[`Últimas manutenções - ${linha.nome}`, "", ""]],
          body: [],
          theme: "grid",
          styles: { fontSize: 10 },
          headStyles: {
            fillColor: [0, 84, 166],
            textColor: 255,
            fontStyle: "bold",
          },
          columnStyles: { 0: { cellWidth: 'wrap' } },
          didDrawPage: (d) => { posY = d.cursor.y + 2; },
        });

        autoTable(doc, {
          startY: posY,
          head: [["Motivo", "Data de entrada", "Data de saída"]],
          body: manutencoes.map((m) => [
            m.motivo,
            new Date(m.criadoEm).toLocaleString("pt-BR"),
            m.finalizadoEm
              ? new Date(m.finalizadoEm).toLocaleString("pt-BR")
              : "Em andamento",
          ]),
          theme: "grid",
          styles: { fontSize: 10 },
          headStyles: { fillColor: [0, 84, 166], textColor: 255 },
          didDrawPage: (d) => { posY = d.cursor.y + 10; },
        });
      }
    }

    // === Caminhões no pátio (todos, exceto finalizados)
    const caminhaoPatio = await prisma.caminhao.findMany({
      where: {
        status: { not: "finalizado" },
      },
      orderBy: { criadoEm: "asc" },
    });

    if (caminhaoPatio.length > 0) {
      autoTable(doc, {
        startY: posY,
        head: [["Caminhões no pátio", "", "", ""]],
        body: [],
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: {
          fillColor: [0, 84, 166],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: { 0: { cellWidth: 'wrap' } },
        didDrawPage: (d) => { posY = d.cursor.y + 2; },
      });

      autoTable(doc, {
        startY: posY,
        head: [["Placa", "Transportadora", "Status", "Entrada"]],
        body: caminhaoPatio.map((c) => [
          c.placa,
          c.transportadora || "-",
          traduzirStatus(c.status),
          new Date(c.criadoEm).toLocaleString("pt-BR"),
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 84, 166], textColor: 255 },
        didDrawPage: (d) => { posY = d.cursor.y + 10; },
      });
    }

    // === Últimos 10 caminhões registrados
    const ultimosCaminhoes = await prisma.caminhao.findMany({
      orderBy: { criadoEm: "desc" },
      take: 10,
    });

    autoTable(doc, {
      startY: posY,
      head: [["Histórico Controle de Caminhões", "", "", ""]],
      body: [],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [0, 84, 166],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: { 0: { cellWidth: 'wrap' } },
      didDrawPage: (d) => { posY = d.cursor.y + 2; },
    });

    autoTable(doc, {
      startY: posY,
      head: [["Placa", "Entrada", "Coleta", "Saída"]],
      body: ultimosCaminhoes.map((c) => [
        c.placa,
        new Date(c.criadoEm).toLocaleString("pt-BR"),
        c.horaColeta ? new Date(c.horaColeta).toLocaleString("pt-BR") : "—",
        c.horaSaida
          ? new Date(c.horaSaida).toLocaleString("pt-BR")
          : "Ainda na fábrica",
      ]),
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 84, 166], textColor: 255 },
      margin: { top: 10 },
    });

    const pdf = doc.output("arraybuffer");

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=relatorio-dashboard.pdf`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF do dashboard:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}