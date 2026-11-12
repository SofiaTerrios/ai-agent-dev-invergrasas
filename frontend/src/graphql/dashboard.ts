export const GET_DASHBOARD_QUERY = `
  query DashboardResumen($empresaId: ID, $desde: String, $hasta: String) {
    dashboardResumen(empresaId: $empresaId, desde: $desde, hasta: $hasta) {
      desde
      hasta
      anterior_desde
      anterior_hasta
      kg_entregados { actual anterior }
      movimientos { actual anterior entregas recolecciones }
      certificados { actual anterior }
      envases { total por_tipo { nombre cantidad } }
      serie_kg { mes producto kg }
      serie_envases { mes entregados recogidos }
      top_clientes_envases { cliente { id razon_social } total detalle }
    }
  }
`;

export type Comparacion = { actual: number; anterior: number };

// Sections the user's role cannot see come back null
export type DashboardResumen = {
  desde: string;
  hasta: string;
  anterior_desde: string;
  anterior_hasta: string;
  kg_entregados: Comparacion | null;
  movimientos: (Comparacion & { entregas: number; recolecciones: number }) | null;
  certificados: Comparacion | null;
  envases: { total: number; por_tipo: { nombre: string; cantidad: number }[] } | null;
  serie_kg: { mes: string; producto: string; kg: number }[] | null;
  serie_envases: { mes: string; entregados: number; recogidos: number }[] | null;
  top_clientes_envases:
    | { cliente: { id: string; razon_social: string }; total: number; detalle: string }[]
    | null;
};

const MESES = new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" });
const MESES_LARGO = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

const fechaUTC = (fecha: string) => new Date(`${fecha.length === 7 ? `${fecha}-01` : fecha}T00:00:00Z`);

// "2026-11" -> "nov"
export const mesCorto = (mes: string) => MESES.format(fechaUTC(mes)).replace(".", "");
// "2026-11" -> "Noviembre de 2026"
export const mesLargo = (mes: string) => {
  const texto = MESES_LARGO.format(fechaUTC(mes));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// "2026-11-01", "2026-11-12" -> "1 nov – 12 nov 2026"
export function rangoFechas(desde: string, hasta: string) {
  const diaMes = (fecha: string) => `${Number(fecha.slice(8, 10))} ${mesCorto(fecha.slice(0, 7))}`;
  const d = diaMes(desde);
  const h = diaMes(hasta);
  const anioD = desde.slice(0, 4);
  const anioH = hasta.slice(0, 4);
  return anioD === anioH ? `${d} – ${h} ${anioH}` : `${d} ${anioD} – ${h} ${anioH}`;
}
