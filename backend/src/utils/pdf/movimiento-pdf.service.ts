import { Injectable } from '@nestjs/common';
import { TipoMovimiento } from '@prisma/client';
import { existsSync, promises as fs } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { logoPath } from './analisis-pdf.service';
import { movimientosDir } from './movimientos-dir';
import {
  MovimientoSnapshot,
  SnapshotEmpresa,
  TITULOS,
} from '../../movimientos/movimiento.types';

export type LineaPdf = {
  producto: string | null;
  cantidad: number | null;
  unidad: string | null;
  empaque: string;
  cantidad_envases: number;
  vacios_recibidos: number;
  vacios_entregados: number;
};

export type MovimientoPdfInput = {
  id: string;
  tipo: TipoMovimiento;
  numero: string;
  // YYYY-MM-DD
  fecha: string;
  snapshot: MovimientoSnapshot;
  lineas: LineaPdf[];
  observacion: string | null;
  firma: Buffer | null;
  anulado: boolean;
};

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// 1234.5 → "1.234,5"
export function formatoNumero(valor: number) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(
    valor,
  );
}

export function formatoNit(empresa: SnapshotEmpresa | null) {
  if (!empresa?.nit) return '—';
  const conPuntos = empresa.nit.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return empresa.dv ? `${conPuntos}-${empresa.dv}` : conPuntos;
}

/**
 * Certificado de entrega y/o recolección (IG-28), built only from the
 * snapshot saved when the movimiento was issued.
 */
@Injectable()
export class MovimientoPdfService {
  private readonly PW = 595.28;
  private readonly PH = 841.89;
  private readonly ML = 50;
  private readonly CW = 595.28 - 100;
  private readonly BOTTOM = 841.89 - 90;
  private readonly VERDE = '#0F6E2E';
  private readonly GRIS = '#555555';
  private readonly FONDO = '#EEF3F0';

  // Writes the PDF and returns the stored file name.
  async generar(input: MovimientoPdfInput): Promise<string> {
    const logo = logoPath();
    if (!existsSync(logo)) {
      throw new Error(`Falta el logo del certificado en ${logo}`);
    }
    const dir = movimientosDir();
    await fs.mkdir(dir, { recursive: true });
    const fileName = `mov-${input.id}.pdf`;
    await fs.writeFile(path.join(dir, fileName), await this.buildPdf(input));
    return fileName;
  }

  private buildPdf(input: MovimientoPdfInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        // Kept in memory so the footer and watermark go on every page
        bufferPages: true,
        info: {
          Title: `${TITULOS[input.tipo]} ${input.numero}`,
          Author: 'INVERGRASAS SAS',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let cy = this.encabezado(doc, input);
      cy = this.datosCliente(doc, input, cy);
      cy = this.detalle(doc, input, cy);
      cy = this.transportador(doc, input, cy);
      cy = this.textos(doc, input, cy);
      this.firmas(doc, input, cy);
      // Footer and watermark on every page
      const paginas = doc.bufferedPageRange();
      for (let i = paginas.start; i < paginas.start + paginas.count; i++) {
        doc.switchToPage(i);
        this.pie(doc);
        if (input.anulado) this.marcaAnulado(doc);
      }
      doc.end();
    });
  }

  private encabezado(doc: PDFKit.PDFDocument, input: MovimientoPdfInput) {
    doc.image(logoPath(), this.ML, 30, { fit: [80, 70] });
    this.texto(
      doc,
      'INVERGRASAS S.A.S.',
      this.ML,
      40,
      'Helvetica-Bold',
      12,
      this.VERDE,
      'right',
    );
    this.texto(
      doc,
      'Compra y venta de grasas animales y vegetales',
      this.ML,
      56,
      'Helvetica',
      9,
      this.GRIS,
      'right',
    );
    this.texto(
      doc,
      TITULOS[input.tipo],
      this.ML,
      115,
      'Helvetica-Bold',
      14,
      '#000000',
      'center',
    );
    this.texto(
      doc,
      `N.º ${input.numero}`,
      this.ML,
      135,
      'Helvetica-Bold',
      11,
      this.VERDE,
      'center',
    );
    return 165;
  }

  private datosCliente(
    doc: PDFKit.PDFDocument,
    input: MovimientoPdfInput,
    cy: number,
  ) {
    const { cliente, sede } = input.snapshot;
    cy = this.seccion(doc, 'DATOS DEL CLIENTE', cy);
    return this.pares(doc, cy, [
      ['Fecha', this.fechaLarga(input.fecha)],
      ['Razón social', cliente.razon_social],
      ['NIT', formatoNit(cliente)],
      ['Registro', cliente.registro],
      ['Nombre local', sede?.nombre],
      ['Actividad', sede?.actividad],
      ['Dirección', sede?.direccion],
      ['Teléfono', sede?.telefono],
      ['Barrio', sede?.barrio],
      ['Localidad', sede?.localidad],
      ['Email', sede?.email],
      ['Ciudad', sede?.ciudad ?? cliente.ciudad],
    ]);
  }

  private detalle(
    doc: PDFKit.PDFDocument,
    input: MovimientoPdfInput,
    cy: number,
  ) {
    cy = this.seccion(doc, 'DETALLE', cy);
    const columnas: [string, number][] = [
      ['Producto', 0.27],
      ['Cantidad', 0.15],
      ['Envase', 0.16],
      ['Envases llenos', 0.13],
      ['Vacíos recibidos', 0.15],
      ['Vacíos entregados', 0.14],
    ];
    const fila = (valores: string[], negrita = false, fondo?: string) => {
      // The header row has room for two-line titles
      const alto = negrita ? 28 : 20;
      cy = this.saltoSiHaceFalta(doc, cy, alto);
      let x = this.ML;
      valores.forEach((valor, i) => {
        const ancho = this.CW * columnas[i][1];
        doc
          .rect(x, cy, ancho, alto)
          .fillAndStroke(fondo ?? '#ffffff', '#999999');
        doc
          .font(negrita ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5)
          .fillColor('#000000')
          .text(valor, x + 4, cy + (negrita ? 5 : 6), {
            width: ancho - 8,
            height: alto - 6,
            align: i === 0 ? 'left' : 'center',
            lineBreak: negrita,
            ellipsis: true,
          });
        x += ancho;
      });
      cy += alto;
    };

    fila(
      columnas.map(([titulo]) => titulo),
      true,
      this.FONDO,
    );
    let totalKg = 0;
    for (const linea of input.lineas) {
      if (linea.unidad === 'kg' && linea.cantidad) totalKg += linea.cantidad;
      fila([
        linea.producto ?? '—',
        linea.cantidad != null
          ? `${formatoNumero(linea.cantidad)} ${linea.unidad ?? ''}`.trim()
          : '—',
        linea.empaque,
        String(linea.cantidad_envases),
        String(linea.vacios_recibidos),
        String(linea.vacios_entregados),
      ]);
    }
    if (totalKg > 0) {
      this.texto(
        doc,
        `Total: ${formatoNumero(totalKg)} kg`,
        this.ML,
        cy + 6,
        'Helvetica-Bold',
        9.5,
        '#000000',
        'right',
      );
      cy += 18;
    }
    const persona = input.snapshot.contacto;
    const rol = input.tipo === 'RECOLECCION' ? 'Entrega' : 'Recibe';
    this.texto(
      doc,
      `${rol}: ${persona ? [persona.nombre, persona.cargo].filter(Boolean).join(' — ') : '—'}`,
      this.ML,
      cy + 8,
      'Helvetica',
      9.5,
      '#000000',
    );
    return cy + 30;
  }

  private transportador(
    doc: PDFKit.PDFDocument,
    input: MovimientoPdfInput,
    cy: number,
  ) {
    const { transportador, conductor, vehiculo, destino } = input.snapshot;
    cy = this.saltoSiHaceFalta(doc, cy, 110);
    cy = this.seccion(doc, 'DATOS DEL TRANSPORTADOR', cy);
    return this.pares(doc, cy, [
      ['Transportador', transportador?.razon_social],
      ['Registro', transportador?.registro],
      ['Conductor', conductor.nombre],
      ['Placa', vehiculo?.placa],
      ['Destino', destino?.razon_social],
      ['Ciudad', destino?.ciudad ?? transportador?.ciudad],
    ]);
  }

  private textos(
    doc: PDFKit.PDFDocument,
    input: MovimientoPdfInput,
    cy: number,
  ) {
    if (input.observacion) {
      cy = this.saltoSiHaceFalta(doc, cy, 40);
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#000000')
        .text('Observación: ', this.ML, cy, {
          continued: true,
        });
      doc.font('Helvetica').text(input.observacion, { width: this.CW });
      cy = doc.y + 10;
    }
    if (input.snapshot.texto) {
      cy = this.saltoSiHaceFalta(doc, cy, 50);
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor('#000000')
        .text(input.snapshot.texto, this.ML, cy, {
          width: this.CW,
          align: 'justify',
        });
      cy = doc.y + 10;
    }
    return cy;
  }

  private firmas(
    doc: PDFKit.PDFDocument,
    input: MovimientoPdfInput,
    cy: number,
  ) {
    cy = this.saltoSiHaceFalta(doc, cy, 120);
    const ancho = 200;
    const xDerecha = this.ML + this.CW - ancho;
    if (input.firma) {
      doc.image(input.firma, this.ML, cy, { fit: [ancho * 0.7, 55] });
    }
    const linea = cy + 60;
    for (const x of [this.ML, xDerecha]) {
      doc
        .moveTo(x, linea)
        .lineTo(x + ancho, linea)
        .strokeColor('#000000')
        .lineWidth(0.5)
        .stroke();
    }
    const { conductor, contacto } = input.snapshot;
    const bloque = (
      x: number,
      nombre: string,
      detalle: string,
      por: string,
    ) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#000000')
        .text(nombre, x, linea + 5, { width: ancho });
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(this.GRIS)
        .text(detalle, x, linea + 18, { width: ancho });
      doc.text(por, x, linea + 30, { width: ancho });
    };
    bloque(
      this.ML,
      conductor.nombre,
      conductor.cargo ?? 'Conductor',
      'Por INVERGRASAS S.A.S.',
    );
    bloque(
      xDerecha,
      contacto?.nombre ?? '',
      contacto?.cargo ?? '',
      `Por ${input.snapshot.cliente.razon_social}`,
    );
  }

  private pie(doc: PDFKit.PDFDocument) {
    const lineas = [
      'INVERGRASAS SAS · NIT. 901.684.306-1',
      'CRA 78 # 41B - 20 SUR · invergrasas@gmail.com · CEL. 3124325472',
    ];
    lineas.forEach((linea, i) =>
      this.texto(
        doc,
        linea,
        this.ML,
        this.PH - 50 + i * 12,
        'Helvetica',
        8,
        this.GRIS,
        'right',
      ),
    );
  }

  private marcaAnulado(doc: PDFKit.PDFDocument) {
    doc.save();
    doc.rotate(-35, { origin: [this.PW / 2, this.PH / 2] });
    doc
      .font('Helvetica-Bold')
      .fontSize(110)
      .fillColor('#D63A2F')
      .fillOpacity(0.18)
      .text('ANULADO', 0, this.PH / 2 - 55, {
        width: this.PW,
        align: 'center',
        lineBreak: false,
      });
    doc.restore();
    doc.fillOpacity(1);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private seccion(doc: PDFKit.PDFDocument, titulo: string, cy: number) {
    cy = this.saltoSiHaceFalta(doc, cy, 40);
    doc.rect(this.ML, cy, this.CW, 18).fill(this.VERDE);
    this.texto(
      doc,
      titulo,
      this.ML + 8,
      cy + 5,
      'Helvetica-Bold',
      9.5,
      '#ffffff',
    );
    return cy + 24;
  }

  // Label/value pairs in two columns
  private pares(
    doc: PDFKit.PDFDocument,
    cy: number,
    pares: [string, string | null | undefined][],
  ) {
    const mitad = this.CW / 2;
    const etiqueta = 75;
    for (let i = 0; i < pares.length; i += 2) {
      cy = this.saltoSiHaceFalta(doc, cy, 16);
      pares.slice(i, i + 2).forEach(([label, valor], j) => {
        const x = this.ML + j * mitad;
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor(this.GRIS)
          .text(label, x, cy, {
            width: etiqueta,
            lineBreak: false,
          });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#000000')
          .text(valor || '—', x + etiqueta, cy, {
            width: mitad - etiqueta - 8,
            lineBreak: false,
            ellipsis: true,
          });
      });
      cy += 16;
    }
    return cy + 8;
  }

  private saltoSiHaceFalta(doc: PDFKit.PDFDocument, cy: number, alto: number) {
    if (cy + alto <= this.BOTTOM) return cy;
    doc.addPage({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return 50;
  }

  private texto(
    doc: PDFKit.PDFDocument,
    texto: string,
    x: number,
    y: number,
    font: string,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
  ) {
    doc.font(font).fontSize(size).fillColor(color);
    doc.text(texto, x, y, {
      width: this.CW - (x - this.ML),
      align,
      lineBreak: false,
    });
  }

  // "2026-04-22" → "22 de abril de 2026"
  private fechaLarga(fecha: string) {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return `${dia} de ${MESES[mes - 1]} de ${anio}`;
  }
}
