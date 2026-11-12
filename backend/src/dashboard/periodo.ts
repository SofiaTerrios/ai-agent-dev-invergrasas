import { BadRequestException } from '@nestjs/common';

// Dates are YYYY-MM-DD strings (Colombian calendar days); arithmetic in UTC.
const dia = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
const texto = (fecha: Date) => fecha.toISOString().slice(0, 10);
const sumarDias = (fecha: string, dias: number) => {
  const d = dia(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return texto(d);
};
const diasDelMes = (anio: number, mes: number) =>
  new Date(Date.UTC(anio, mes, 0)).getUTCDate();

export type Periodo = {
  desde: string;
  hasta: string;
  anterior_desde: string;
  anterior_hasta: string;
  // The 12 months of the series, oldest first, YYYY-MM
  meses: string[];
};

/**
 * Period of the dashboard KPIs and the one they are compared with.
 * - No dates: this month so far.
 * - Compared with: the same days of the month before when the range starts on
 *   the 1st of its last month, the same days of last year when it starts on
 *   1 January, otherwise the same number of days just before.
 * The series cover the 12 months ending in the month of `hasta`.
 */
export function calcularPeriodo(
  hoy: string,
  desdeArg?: string,
  hastaArg?: string,
): Periodo {
  let hasta = hoy;
  let desde = `${hoy.slice(0, 7)}-01`;
  if (desdeArg || hastaArg) {
    hasta = (hastaArg ?? hoy).slice(0, 10);
    desde = (desdeArg ?? `${hasta.slice(0, 7)}-01`).slice(0, 10);
  }
  if (desde > hasta) {
    throw new BadRequestException('La fecha inicial es posterior a la final');
  }

  const [anio, mes, d] = hasta.split('-').map(Number);
  const fecha = (a: number, m: number, dd: number) =>
    `${a}-${String(m).padStart(2, '0')}-${String(Math.min(dd, diasDelMes(a, m))).padStart(2, '0')}`;
  let anterior_desde: string;
  let anterior_hasta: string;

  if (desde === `${hasta.slice(0, 7)}-01`) {
    // From the 1st of a month: the same days of the month before
    const anioAnt = mes === 1 ? anio - 1 : anio;
    const mesAnt = mes === 1 ? 12 : mes - 1;
    anterior_desde = fecha(anioAnt, mesAnt, 1);
    anterior_hasta = fecha(anioAnt, mesAnt, d);
  } else if (desde === `${anio}-01-01`) {
    // Year to date: the same days of the year before
    anterior_desde = `${anio - 1}-01-01`;
    anterior_hasta = fecha(anio - 1, mes, d);
  } else {
    const dias =
      Math.round((dia(hasta).getTime() - dia(desde).getTime()) / 86_400_000) +
      1;
    anterior_hasta = sumarDias(desde, -1);
    anterior_desde = sumarDias(anterior_hasta, -(dias - 1));
  }

  const [anioFin, mesFin] = hasta.split('-').map(Number);
  const meses = Array.from({ length: 12 }, (_, i) => {
    const total = anioFin * 12 + (mesFin - 1) - (11 - i);
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
  });
  return { desde, hasta, anterior_desde, anterior_hasta, meses };
}
