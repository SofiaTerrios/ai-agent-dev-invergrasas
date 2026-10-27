import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import {
  FiltrosMovimientos,
  MovimientosService,
  movimientoInclude,
  toMovimiento,
} from '../movimientos/movimientos.service';
import { InventarioService } from '../inventario/inventario.service';
import { formatoNit } from '../utils/pdf/movimiento-pdf.service';

type Actor = { id: string; rol?: string };

const TIPOS: Record<string, string> = {
  ENTREGA: 'Entrega',
  RECOLECCION: 'Recolección',
  ENTREGA_Y_RECOLECCION: 'Entrega y recolección',
};

// Rows of the export; above this the filters should be narrowed
const MAXIMO_MOVIMIENTOS = 20_000;

/**
 * Excel of entregas and recolecciones (IG-33). Totals use the same rules as
 * the dashboard: annulled movimientos are listed but do not add up.
 */
@Injectable()
export class InformesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly movimientos: MovimientosService,
    private readonly inventario: InventarioService,
  ) {}

  async movimientosXlsx(actor: Actor, filtros: FiltrosMovimientos) {
    const where = await this.movimientos.whereAccesible(actor, filtros);
    const filas = (
      await this.prisma.movimiento.findMany({
        where,
        include: movimientoInclude,
        orderBy: [{ fecha: 'asc' }, { anio: 'asc' }, { numero: 'asc' }],
        take: MAXIMO_MOVIMIENTOS,
      })
    ).map(toMovimiento);

    const libro = new ExcelJS.Workbook();
    libro.creator = 'Invergrasas';
    libro.created = new Date();

    // ── Movimientos: one row per línea ──
    const hoja = libro.addWorksheet('Movimientos', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    hoja.columns = [
      {
        header: 'Fecha',
        key: 'fecha',
        width: 12,
        style: { numFmt: 'dd/mm/yyyy' },
      },
      { header: 'N.º recibo', key: 'numero', width: 12 },
      { header: 'Cliente', key: 'cliente', width: 32 },
      { header: 'NIT', key: 'nit', width: 16 },
      { header: 'Sede', key: 'sede', width: 24 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Producto', key: 'producto', width: 22 },
      {
        header: 'Cantidad',
        key: 'cantidad',
        width: 11,
        style: { numFmt: '#,##0.00' },
      },
      { header: 'Unidad', key: 'unidad', width: 8 },
      { header: 'Envase', key: 'envase', width: 12 },
      { header: 'Envases llenos', key: 'envases', width: 10 },
      { header: 'Vacíos recibidos', key: 'recibidos', width: 10 },
      { header: 'Vacíos entregados', key: 'entregados', width: 10 },
      { header: 'Kg', key: 'kg', width: 11, style: { numFmt: '#,##0.00' } },
      { header: 'Entregó', key: 'entrego', width: 22 },
      { header: 'Recibió', key: 'recibio', width: 22 },
      { header: 'Estado', key: 'estado', width: 10 },
    ];
    for (const m of filas) {
      for (const linea of m.lineas) {
        hoja.addRow({
          fecha: new Date(`${m.fecha}T12:00:00`),
          numero: m.numero_formateado,
          cliente: m.snapshot.cliente.razon_social,
          nit: formatoNit(m.snapshot.cliente),
          sede: m.snapshot.sede?.nombre ?? '',
          tipo: TIPOS[m.tipo],
          producto: linea.producto?.nombre ?? '',
          cantidad: linea.cantidad,
          unidad: linea.unidad_medida ?? '',
          envase: linea.tipo_empaque.nombre,
          envases: linea.cantidad_envases,
          recibidos: linea.vacios_recibidos,
          entregados: linea.vacios_entregados,
          kg: linea.unidad_medida === 'kg' ? linea.cantidad : null,
          entrego: m.snapshot.conductor.nombre,
          recibio: m.snapshot.contacto?.nombre ?? '',
          estado: m.anulado ? 'ANULADO' : 'Vigente',
        });
      }
    }
    this.formatoTabla(hoja);

    // ── Resumen ──
    const resumen = libro.addWorksheet('Resumen');
    resumen.columns = [
      { key: 'a', width: 34 },
      { key: 'b', width: 18 },
      { key: 'c', width: 24 },
      { key: 'd', width: 14, style: { numFmt: '#,##0.00' } },
    ];
    const titulo = (texto: string) => {
      const fila = resumen.addRow([texto]);
      fila.font = { bold: true, size: 12 };
    };
    titulo('Kg entregados por cliente y producto (sin anulados)');
    const encabezado = resumen.addRow(['Cliente', 'NIT', 'Producto', 'Kg']);
    encabezado.font = { bold: true };
    const kg = new Map<
      string,
      { cliente: string; nit: string; producto: string; kg: number }
    >();
    for (const m of filas.filter((f) => !f.anulado)) {
      for (const linea of m.lineas) {
        if (linea.unidad_medida !== 'kg' || !linea.cantidad || !linea.producto)
          continue;
        const clave = `${m.cliente_id}|${linea.producto.id}`;
        const actual = kg.get(clave) ?? {
          cliente: m.snapshot.cliente.razon_social,
          nit: formatoNit(m.snapshot.cliente),
          producto: linea.producto.nombre,
          kg: 0,
        };
        actual.kg += linea.cantidad;
        kg.set(clave, actual);
      }
    }
    const filasKg = [...kg.values()].sort((a, b) =>
      a.cliente.localeCompare(b.cliente, 'es'),
    );
    for (const f of filasKg)
      resumen.addRow([f.cliente, f.nit, f.producto, f.kg]);
    const total = resumen.addRow([
      'Total',
      '',
      '',
      filasKg.reduce((suma, f) => suma + f.kg, 0),
    ]);
    total.font = { bold: true };

    resumen.addRow([]);
    titulo('Saldo actual de envases por cliente');
    const encabezadoSaldo = resumen.addRow([
      'Cliente',
      'NIT',
      'Envase',
      'Saldo',
    ]);
    encabezadoSaldo.font = { bold: true };
    const saldos = await this.inventario.saldos(
      actor,
      filtros.empresaId,
      filtros.clienteId,
    );
    for (const s of saldos) {
      const fila = resumen.addRow([
        s.cliente.razon_social,
        formatoNit({
          ...s.cliente,
          razon_social: '',
          registro: null,
          ciudad: null,
        }),
        s.tipo_empaque.nombre,
        s.saldo,
      ]);
      fila.getCell(4).numFmt = '#,##0';
    }

    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  private formatoTabla(hoja: ExcelJS.Worksheet) {
    const encabezado = hoja.getRow(1);
    encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    encabezado.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F6E2E' },
    };
    hoja.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: hoja.columnCount },
    };
  }
}
