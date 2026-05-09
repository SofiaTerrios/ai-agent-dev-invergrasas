import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

type ParametroFila = {
  nombre: string;
  valor: string;
};

type CreateAnalisisPdfInput = {
  certificadoId: string;
  tipo: 'oleina' | 'rbd';
  empresa_cliente: string;
  nit_cliente?: string | null;
  lote: string;
  peso_kg?: number | null;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  firmado_por: string;
  firma_img_path?: string | null;
  logo_img_path?: string | null;
  parametros: ParametroFila[];
};

@Injectable()
export class AnalisisPdfService {

  private readonly PW = 595.28;
  private readonly PH = 841.89;
  private readonly ML = 70;
  private readonly MR = 70;
  private readonly MT = 50;
  private readonly CW = 595.28 - 140;

  private readonly BLACK    = '#000000';
  private readonly GRAY     = '#555555';
  private readonly LIGHT_BG = '#f0f0f0';

  private readonly outputDir = path.join(process.cwd(), 'static', 'certificados');

  async generateCertificadoAnalisisPdf(input: CreateAnalisisPdfInput): Promise<string> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const fileName = `cert-${input.certificadoId}.pdf`;
    const filePath = path.join(this.outputDir, fileName);
    const buffer   = await this.buildPdf(input);
    await fs.writeFile(filePath, buffer);
    return `/static/certificados/${fileName}`;
  }

  private buildPdf(input: CreateAnalisisPdfInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        autoFirstPage: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: {
          Title: `Certificado ${input.tipo.toUpperCase()} - ${input.lote}`,
          Author: 'INVERGRASAS SAS',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // cy empieza arriba y SUMA hacia abajo (coordenadas PDFKit nativas)
      let cy = this.MT;

      cy = this.drawLogo(doc, input, cy);
      cy = this.drawCityDate(doc, input, cy);
      cy = this.drawRecipient(doc, input, cy);
      cy = this.drawSubject(doc, input, cy);
      cy = this.drawLotePeso(doc, input, cy);
      cy = this.drawTable(doc, input, cy);
      cy = this.drawFechaVencimiento(doc, input, cy);
           this.drawClosingBlock(doc, input, cy);

      doc.end();
    });
  }

  // ── Logo (arriba a la derecha) ────────────────────────────────────────────

  private drawLogo(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): number {
    const logoH = 45;
    const logoW = 100;

    if (input.logo_img_path) {
      try {
        doc.image(input.logo_img_path, this.PW - this.MR - logoW, cy, {
          width: logoW,
          height: logoH,
          fit: [logoW, logoH],
          align: 'right',
        });
      } catch {
        this.txt(doc, '[LOGO INVERGRASAS]', this.ML, cy, 'Helvetica-Bold', 8, this.GRAY, 'right');
      }
    } else {
      this.txt(doc, '[LOGO INVERGRASAS]', this.ML, cy, 'Helvetica-Bold', 8, this.GRAY, 'right');
    }
    return cy + 50;  // avanza hacia abajo
  }

  // ── Ciudad + fecha ────────────────────────────────────────────────────────

  private drawCityDate(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): number {
    this.txt(doc, `${this.formatFechaEmision(input.fecha_emision)}.`, this.ML, cy, 'Times-Roman', 11, this.BLACK);
    return cy + 34;
  }

  // ── Destinatario ──────────────────────────────────────────────────────────

  private drawRecipient(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): number {
    this.txt(doc, 'Señores:',            this.ML, cy,      'Times-Roman', 11, this.BLACK);
    this.txt(doc, input.empresa_cliente, this.ML, cy + 17, 'Times-Bold',  11, this.BLACK);
    this.txt(doc, 'Ciudad',              this.ML, cy + 34, 'Times-Roman', 11, this.BLACK);
    return cy + 34 + 36;
  }

  // ── Asunto (centrado) ─────────────────────────────────────────────────────

  private drawSubject(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): number {
    const tipo  = input.tipo === 'oleina' ? 'OLEINA DE PALMA' : 'RBD';
    const label = `ASUNTO: CERTIFICADO ANALISIS - ${tipo}`;
    this.txt(doc, label, this.ML, cy, 'Times-Bold', 11, this.BLACK, 'center');
    return cy + 34;
  }

  // ── Lote + Peso ───────────────────────────────────────────────────────────

  private drawLotePeso(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): number {
    const loteLabel = 'Lote';
    const loteValue = `: ${input.lote}`;
    const loteW     = doc.font('Times-Bold').fontSize(11).widthOfString(loteLabel);
    this.txt(doc, loteLabel, this.ML,         cy, 'Times-Bold',  11, this.BLACK);
    this.txt(doc, loteValue, this.ML + loteW, cy, 'Times-Roman', 11, this.BLACK);
    cy += 20;

    if (input.tipo === 'rbd' && input.peso_kg != null) {
      const pesoLabel = 'Peso';
      const pesoValue = `: ${this.formatPeso(input.peso_kg)} kilos`;
      const pesoW     = doc.font('Times-Bold').fontSize(11).widthOfString(pesoLabel);
      this.txt(doc, pesoLabel, this.ML,         cy, 'Times-Bold',  11, this.BLACK);
      this.txt(doc, pesoValue, this.ML + pesoW, cy, 'Times-Roman', 11, this.BLACK);
      cy += 20;
    }

    return cy + 14;
  }

  // ── Tabla de parámetros ───────────────────────────────────────────────────

  private drawTable(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): number {
    this.txt(doc, 'ESPECIFICACIONES FISICOQUIMICAS:', this.ML, cy, 'Times-Bold', 11, this.BLACK);
    cy += 18;

    const col1 = this.CW * 0.65;
    const col2 = this.CW * 0.35;
    const rowH = 22;
    const padX = 8;
    const padY = 6;

    const drawRow = (y: number, label: string, value: string, isHeader = false): number => {
      const bg   = isHeader ? this.LIGHT_BG : '#ffffff';
      const font = isHeader ? 'Times-Bold' : 'Times-Roman';

      doc.rect(this.ML,        y, col1, rowH).fillAndStroke(bg, this.BLACK);
      doc.rect(this.ML + col1, y, col2, rowH).fillAndStroke(bg, this.BLACK);

      doc.font(font).fontSize(10.5).fillColor(this.BLACK)
        .text(label, this.ML + padX, y + padY, {
          width: col1 - padX * 2,
          lineBreak: false,
          ellipsis: true,
        });

      doc.font(isHeader ? 'Times-Bold' : 'Times-Roman').fontSize(10.5).fillColor(this.BLACK)
        .text(value, this.ML + col1 + padX, y + padY, {
          width: col2 - padX * 2,
          align: 'center',
          lineBreak: false,
        });

      return y + rowH;  // avanza hacia abajo
    };

    cy = drawRow(cy, 'CARACTERISTICAS', 'RESULTADO', true);
    for (const p of input.parametros) {
      cy = drawRow(cy, p.nombre, this.formatValor(p.valor));
    }

    return cy + 20;
  }

  // ── Fecha de vencimiento ──────────────────────────────────────────────────

  private drawFechaVencimiento(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): number {
    const fecha = this.formatFechaCorta(input.fecha_vencimiento);
    this.txt(doc, 'FECHA DE VENCIMIENTO:', this.ML, cy,      'Times-Bold',  11, this.BLACK, 'right');
    this.txt(doc, `${fecha}.`,             this.ML, cy + 17, 'Times-Roman', 11, this.BLACK, 'right');
    return cy + 17 + 38;
  }

  // ── Bloque de cierre ──────────────────────────────────────────────────────

  private drawClosingBlock(
    doc: PDFKit.PDFDocument,
    input: CreateAnalisisPdfInput,
    cy: number,
  ): void {
    this.txt(doc, 'Cordialmente,', this.ML, cy, 'Times-Roman', 11, this.BLACK);
    cy += 18;

    const sigH = 65;
    const sigW = 130;

    if (input.firma_img_path) {
      try {
        doc.image(input.firma_img_path, this.ML, cy, {
          width: sigW,
          height: sigH,
          fit: [sigW, sigH],
        });
      } catch {
        // espacio en blanco si no se encuentra
      }
    }

    cy += sigH + 2;

    // Línea bajo la firma
    doc
      .moveTo(this.ML, cy)
      .lineTo(this.ML + sigW, cy)
      .strokeColor(this.BLACK)
      .lineWidth(0.5)
      .stroke();

    // Nombre y empresa del firmante
    this.txt(doc, input.firmado_por, this.ML, cy + 4,  'Times-Roman', 11, this.BLACK);
    this.txt(doc, 'INVERGRASAS SAS', this.ML, cy + 20, 'Times-Bold',  11, this.BLACK);

    // Información de la empresa (derecha)
    const infoLines: Array<[string, string]> = [
      ['Helvetica-Bold', 'INVERGRASAS SAS'],
      ['Helvetica',      'NIT. 901.684.306-1'],
      ['Helvetica',      'CRA 78 # 41B - 20 SUR'],
      ['Helvetica',      'invergrasas@gmail.com'],
      ['Helvetica',      'CEL. 3124325472'],
    ];

    let infoY = cy + 4;
    for (const [font, line] of infoLines) {
      this.txt(doc, line, this.ML, infoY, font, 8, this.GRAY, 'right');
      infoY += 12;
    }
  }

  // ── Helper de texto ───────────────────────────────────────────────────────

  private txt(
    doc: PDFKit.PDFDocument,
    text: string,
    x: number,
    y: number,
    font: string,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
  ): void {
    doc.font(font).fontSize(size).fillColor(color);
    doc.text(text, x, y, {
      width:     this.CW,
      align,
      lineBreak: false,
    });
  }

  // ── Helpers de fecha y formato ────────────────────────────────────────────

  private formatFechaEmision(date: Date): string {
    const months = [
      'enero','febrero','marzo','abril','mayo','junio',
      'julio','agosto','septiembre','octubre','noviembre','diciembre',
    ];
    const dd = String(date.getDate()).padStart(2, '0');
    return `Bogota D.C, ${months[date.getMonth()]} ${dd} de ${date.getFullYear()}`;
  }

  private formatFechaCorta(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${date.getFullYear()}`;
  }

  private formatPeso(kg: number): string {
    const [int, dec] = kg.toFixed(1).split('.');
    const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFmt},${dec}`;
  }

  private formatValor(valor: string): string {
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num)) return valor;
    const decimals = (valor.split(/[.,]/)[1] ?? '').length;
    return num.toFixed(decimals).replace('.', ',');
  }
}