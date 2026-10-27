// Entregas y recolecciones (IG-39), inventario de envases (IG-31)

export type TipoMovimiento = "ENTREGA" | "RECOLECCION" | "ENTREGA_Y_RECOLECCION";

export const TIPOS_MOVIMIENTO: { value: TipoMovimiento; label: string }[] = [
  { value: "ENTREGA", label: "Entrega" },
  { value: "RECOLECCION", label: "Recolección" },
  { value: "ENTREGA_Y_RECOLECCION", label: "Entrega y recolección" },
];

export const TIPO_MOVIMIENTO_LABEL = Object.fromEntries(
  TIPOS_MOVIMIENTO.map((t) => [t.value, t.label]),
) as Record<TipoMovimiento, string>;

export const UNIDADES_MEDIDA = ["kg", "galón", "litro"] as const;

export const entrega = (tipo: TipoMovimiento) => tipo !== "RECOLECCION";
export const recoleccion = (tipo: TipoMovimiento) => tipo !== "ENTREGA";

type SnapshotEmpresa = {
  razon_social: string;
  nit: string | null;
  dv: string | null;
  registro: string | null;
  ciudad: string | null;
};

export type Movimiento = {
  id: string;
  empresa_id: string;
  numero: number;
  numero_formateado: string;
  tipo: TipoMovimiento;
  fecha: string;
  cliente_id: string;
  usuario_entrega: { id: string; nombre: string };
  observacion: string | null;
  total_kg: number;
  archivo_url: string;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por_nombre: string | null;
  motivo_anulacion: string | null;
  migrado: boolean;
  snapshot: {
    cliente: SnapshotEmpresa;
    sede: {
      nombre: string;
      actividad: string | null;
      direccion: string | null;
      telefono: string | null;
      barrio: string | null;
      localidad: string | null;
      email: string | null;
      ciudad: string | null;
    } | null;
    contacto: { nombre: string; cargo: string | null } | null;
    conductor: { nombre: string };
    vehiculo: { placa: string } | null;
    transportador: SnapshotEmpresa | null;
    destino: SnapshotEmpresa | null;
  };
  lineas: {
    id: string;
    producto: { id: string; nombre: string } | null;
    unidad_medida: string | null;
    cantidad: number | null;
    tipo_empaque: { id: string; nombre: string; retornable: boolean };
    cantidad_envases: number;
    vacios_recibidos: number;
    vacios_entregados: number;
  }[];
};

const EMPRESA = `razon_social nit dv registro ciudad`;
const MOVIMIENTO_FIELDS = `
  id empresa_id numero numero_formateado tipo fecha cliente_id observacion total_kg archivo_url
  anulado anulado_at anulado_por_nombre motivo_anulacion migrado
  usuario_entrega { id nombre }
  snapshot {
    cliente { ${EMPRESA} }
    sede { nombre actividad direccion telefono barrio localidad email ciudad }
    contacto { nombre cargo }
    conductor { nombre }
    vehiculo { placa }
    transportador { ${EMPRESA} }
    destino { ${EMPRESA} }
  }
  lineas {
    id unidad_medida cantidad cantidad_envases vacios_recibidos vacios_entregados
    producto { id nombre }
    tipo_empaque { id nombre retornable }
  }
`;

export const GET_MOVIMIENTOS_QUERY = `
  query GetMovimientos(
    $first: Int, $after: String, $empresaId: ID, $clienteId: ID, $tipo: TipoMovimiento,
    $productoId: ID, $fechaDesde: String, $fechaHasta: String
  ) {
    movimientos(
      first: $first, after: $after, empresaId: $empresaId, clienteId: $clienteId, tipo: $tipo,
      productoId: $productoId, fechaDesde: $fechaDesde, fechaHasta: $fechaHasta
    ) {
      edges { node { ${MOVIMIENTO_FIELDS} } }
      pageInfo { endCursor hasNextPage }
      totalCount
    }
  }
`;

export const CREATE_MOVIMIENTO_MUTATION = `
  mutation CreateMovimiento($input: CreateMovimientoInput!) {
    createMovimiento(input: $input) { ${MOVIMIENTO_FIELDS} }
  }
`;

export const ANULAR_MOVIMIENTO_MUTATION = `
  mutation AnularMovimiento($id: ID!, $motivo: String!) {
    anularMovimiento(id: $id, motivo: $motivo) { id }
  }
`;

export const GET_CONDUCTORES_QUERY = `
  query GetConductores($empresaId: ID!) {
    conductores(empresaId: $empresaId) { id nombre vehiculo_por_defecto_id tiene_firma }
  }
`;

export const GET_TEXTOS_QUERY = `
  query GetTextos { textosCertificador { tipo texto } }
`;

export const UPDATE_TEXTO_MUTATION = `
  mutation UpdateTexto($tipo: TipoMovimiento!, $texto: String!) {
    actualizarTextoCertificador(tipo: $tipo, texto: $texto) { tipo texto }
  }
`;

export const GET_SALDOS_QUERY = `
  query GetSaldos($empresaId: ID, $clienteId: ID) {
    inventarioEnvases(empresaId: $empresaId, clienteId: $clienteId) {
      saldo
      cliente { id razon_social }
      tipo_empaque { id nombre }
    }
  }
`;

export const GET_HISTORIAL_ENVASES_QUERY = `
  query GetHistorialEnvases($clienteId: ID!) {
    historialEnvases(clienteId: $clienteId) {
      id fecha cantidad motivo creado_por_nombre movimiento_numero movimiento_tipo anulado
      tipo_empaque { id nombre }
    }
  }
`;

export const AJUSTAR_INVENTARIO_MUTATION = `
  mutation AjustarInventario($input: AjusteInventarioInput!) {
    ajustarInventario(input: $input) { saldo }
  }
`;

export type Conductor = {
  id: string;
  nombre: string;
  vehiculo_por_defecto_id: string | null;
  tiene_firma: boolean;
};

export type SaldoEnvase = {
  saldo: number;
  cliente: { id: string; razon_social: string };
  tipo_empaque: { id: string; nombre: string };
};

export type MovimientoInventario = {
  id: string;
  fecha: string;
  cantidad: number;
  motivo: string | null;
  creado_por_nombre: string | null;
  movimiento_numero: string | null;
  movimiento_tipo: TipoMovimiento | null;
  anulado: boolean;
  tipo_empaque: { id: string; nombre: string };
};

// "2026-10-27" → "27/10/2026"
export function formatFechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

// Today in Colombia, YYYY-MM-DD
export function hoyEnBogota() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export function formatNumero(valor: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(valor);
}
