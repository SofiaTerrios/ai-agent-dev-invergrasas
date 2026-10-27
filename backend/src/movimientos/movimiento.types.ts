import { TipoMovimiento } from '@prisma/client';

export type SnapshotEmpresa = {
  razon_social: string;
  nit: string | null;
  dv: string | null;
  registro: string | null;
  ciudad: string | null;
};

export type SnapshotSede = {
  nombre: string;
  actividad: string | null;
  direccion: string | null;
  telefono: string | null;
  barrio: string | null;
  localidad: string | null;
  email: string | null;
  ciudad: string | null;
};

export type SnapshotPersona = {
  nombre: string;
  cargo: string | null;
  documento: string | null;
};

/**
 * Copy of the data printed on the certificado when it was issued (IG-28):
 * later changes to the cliente, sede, contacto or conductor do not alter it.
 */
export type MovimientoSnapshot = {
  cliente: SnapshotEmpresa;
  sede: SnapshotSede | null;
  contacto: SnapshotPersona | null;
  conductor: SnapshotPersona;
  vehiculo: { placa: string; descripcion: string | null } | null;
  transportador: SnapshotEmpresa | null;
  destino: SnapshotEmpresa | null;
  // Texto certificador vigente al emitir
  texto?: string;
  // Movimientos que vienen de la tabla pedidos
  migrado_de_pedido?: boolean;
};

export const TITULOS: Record<TipoMovimiento, string> = {
  ENTREGA: 'CERTIFICADO DE ENTREGA DE PRODUCTO',
  RECOLECCION: 'CERTIFICADO DE RECOLECCIÓN DE ENVASES',
  ENTREGA_Y_RECOLECCION: 'CERTIFICADO DE ENTREGA Y RECOLECCIÓN',
};

// Default certifying texts; the business defines the final ones and the
// super admin edits them (configuracion `movimientos.texto.<TIPO>`).
export const TEXTOS_POR_DEFECTO: Record<TipoMovimiento, string> = {
  ENTREGA:
    'INVERGRASAS S.A.S. certifica que en la fecha indicada entregó al cliente los productos y envases relacionados en este documento, recibidos por la persona que firma.',
  RECOLECCION:
    'INVERGRASAS S.A.S. certifica que en la fecha indicada recogió del cliente los envases vacíos relacionados en este documento, entregados por la persona que firma.',
  ENTREGA_Y_RECOLECCION:
    'INVERGRASAS S.A.S. certifica que en la fecha indicada entregó al cliente los productos y envases relacionados en este documento y recogió los envases vacíos indicados, con la conformidad de la persona que firma.',
};

export const UNIDADES_MEDIDA = ['kg', 'galón', 'litro'] as const;

// "12" + 2026 → "012-2026"
export function numeroFormateado(numero: number, anio: number) {
  return `${String(numero).padStart(3, '0')}-${anio}`;
}
