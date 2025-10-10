import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import logoBase64 from "./logo-base64-validado";

const empresaNome = "Flucor - Relatório de Dashboard";

export async function gerarPDFComEstiloPadrao(secoes: any[]) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 vertical
  const { width } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let cursorY = 780;

  // Inserir logo usando base64
  try {
    const base64Data = logoBase64.split(",")[1]; // remove prefixo data:image/png;base64,
    const logoBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const logoImg = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImg.scale(0.3);
    page.drawImage(logoImg, {
      x: 50,
      y: cursorY - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (err) {
    console.warn("⚠ Erro ao carregar logo base64:", err);
  }

  // Título e data
  page.drawText(empresaNome, {
    x: 200,
    y: cursorY,
    size: 14,
    font: fontBold,
  });

  page.drawText(new Date().toLocaleString("pt-BR"), {
    x: width - 200,
    y: cursorY - 15,
    size: 10,
    font,
  });

  cursorY -= 60;

  for (const secao of secoes) {
    if (cursorY < 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      cursorY = 750;
    }

    if (secao.tituloSecao) {
      page.drawText(secao.tituloSecao, {
        x: 50,
        y: cursorY,
        size: 12,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      cursorY -= 20;
    }

    if (secao.colunas && secao.linhas) {
      // Cabeçalho da tabela
      secao.colunas.forEach((col: string, index: number) => {
        page.drawText(col, {
          x: 50 + index * 100,
          y: cursorY,
          size: 10,
          font: fontBold,
        });
      });
      cursorY -= 15;

      // Linhas da tabela
      for (const linha of secao.linhas) {
        linha.forEach((cel: string, index: number) => {
          page.drawText(String(cel), {
            x: 50 + index * 100,
            y: cursorY,
            size: 9,
            font,
          });
        });
        cursorY -= 13;

        if (cursorY < 80) {
          page = pdfDoc.addPage([595.28, 841.89]);
          cursorY = 750;
        }
      }

      cursorY -= 20;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}