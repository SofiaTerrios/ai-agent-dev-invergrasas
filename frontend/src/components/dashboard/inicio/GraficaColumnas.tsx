"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumero } from "@/graphql/movimientos";
import { mesCorto, mesLargo } from "@/graphql/dashboard";

export type Serie = { clave: string; nombre: string; color: string; valores: number[] };

type Props = {
  titulo: string;
  descripcion: string;
  // YYYY-MM, oldest first
  meses: string[];
  series: Serie[];
  // Stacked: parts of one total (kg by product). Grouped: compare (entregados vs recogidos).
  modo: "apilado" | "agrupado";
  unidad: string;
  vacio: string;
};

const ALTO = 220;
const MARGEN = { arriba: 12, derecha: 8, abajo: 26, izquierda: 52 };
const ANCHO_MAX_BARRA = 24;
const RADIO = 4;
const SEPARACION = 2;

// Round axis maximum: 1, 2 or 5 times a power of ten, split in 4 ticks
function escala(maximo: number) {
  if (maximo <= 0) return { tope: 4, paso: 1 };
  const bruto = maximo / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto)!;
  return { tope: paso * 4, paso };
}

const abreviar = (valor: number) =>
  valor >= 1_000_000
    ? `${formatNumero(valor / 1_000_000)} M`
    : valor >= 1_000
      ? `${formatNumero(valor / 1_000)} mil`
      : formatNumero(valor);

// Bar anchored to the baseline with only its data end rounded
function barra(x: number, y: number, ancho: number, alto: number, redondear: boolean) {
  if (alto <= 0) return "";
  const r = redondear ? Math.min(RADIO, alto, ancho / 2) : 0;
  return [
    `M${x},${y + alto}`,
    `V${y + r}`,
    r ? `Q${x},${y} ${x + r},${y}` : "",
    `H${x + ancho - r}`,
    r ? `Q${x + ancho},${y} ${x + ancho},${y + r}` : "",
    `V${y + alto}`,
    "Z",
  ].join(" ");
}

function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, ancho] as const;
}

export default function GraficaColumnas({ titulo, descripcion, meses, series, modo, unidad, vacio }: Props) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);
  const [verTabla, setVerTabla] = useState(false);

  const totales = meses.map((_, i) => series.reduce((suma, s) => suma + s.valores[i], 0));
  const sinDatos = totales.every((t) => t === 0);
  const maximo =
    modo === "apilado" ? Math.max(...totales) : Math.max(...series.flatMap((s) => s.valores));
  const { tope, paso } = escala(maximo);

  const anchoPlot = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 0);
  const altoPlot = ALTO - MARGEN.arriba - MARGEN.abajo;
  const banda = anchoPlot / meses.length;
  const y = (valor: number) => MARGEN.arriba + altoPlot - (valor / tope) * altoPlot;
  const anchoBarra =
    modo === "apilado"
      ? Math.min(ANCHO_MAX_BARRA, banda * 0.6)
      : Math.min(ANCHO_MAX_BARRA, (banda * 0.7 - SEPARACION * (series.length - 1)) / series.length);
  // On narrow screens label every other month
  const saltoEtiqueta = banda < 34 ? 2 : 1;
  const ticks = Array.from({ length: 5 }, (_, i) => i * paso);

  return (
    <section className="border border-[#DDE8E2] bg-white p-5 shadow-sm" aria-label={titulo}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#17251F]">{titulo}</h2>
          <p className="mt-0.5 text-sm text-[#63766D]">{descripcion}</p>
        </div>
        {!sinDatos && (
          <button
            type="button"
            onClick={() => setVerTabla((v) => !v)}
            className="rounded-md border border-[#D5E1DB] px-3 py-1.5 text-xs font-semibold text-[#345247] hover:bg-[#F1F6F3]"
          >
            {verTabla ? "Ver gráfica" : "Ver tabla"}
          </button>
        )}
      </div>

      {sinDatos ? (
        <p className="mt-6 grid h-40 place-items-center rounded-md bg-[#F7FAF8] px-4 text-center text-sm text-[#63766D]">
          {vacio}
        </p>
      ) : verTabla ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-[#DDE8E2] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#7D8E86]">
                <th className="py-2 pr-3">Mes</th>
                {series.map((s) => (
                  <th key={s.clave} className="py-2 pr-3 text-right">
                    {s.nombre}
                  </th>
                ))}
                {modo === "apilado" && series.length > 1 && <th className="py-2 text-right">Total</th>}
              </tr>
            </thead>
            <tbody>
              {meses.map((mes, i) => (
                <tr key={mes} className="border-b border-[#EEF3F0] text-[#17251F]">
                  <td className="py-2 pr-3">{mesLargo(mes)}</td>
                  {series.map((s) => (
                    <td key={s.clave} className="py-2 pr-3 text-right tabular-nums">
                      {formatNumero(s.valores[i])}
                    </td>
                  ))}
                  {modo === "apilado" && series.length > 1 && (
                    <td className="py-2 text-right font-semibold tabular-nums">{formatNumero(totales[i])}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-[#7D8E86]">Valores en {unidad}.</p>
        </div>
      ) : (
        <>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#486358]" aria-label="Leyenda">
            {series.map((s) => (
              <li key={s.clave} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                {s.nombre}
              </li>
            ))}
          </ul>
          <div ref={ref} className="relative mt-2" onMouseLeave={() => setActivo(null)}>
            {ancho > 0 && (
              <svg width={ancho} height={ALTO} role="img" aria-label={`${titulo}. ${descripcion}`}>
                {ticks.map((t) => (
                  <g key={t}>
                    <line
                      x1={MARGEN.izquierda}
                      x2={ancho - MARGEN.derecha}
                      y1={y(t)}
                      y2={y(t)}
                      stroke={t === 0 ? "#B9C8C0" : "#EEF3F0"}
                      strokeWidth={1}
                    />
                    <text x={MARGEN.izquierda - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#7D8E86">
                      {abreviar(t)}
                    </text>
                  </g>
                ))}
                {meses.map((mes, i) => {
                  const centro = MARGEN.izquierda + banda * i + banda / 2;
                  let acumulado = 0;
                  return (
                    <g key={mes}>
                      {activo === i && (
                        <rect
                          x={centro - banda / 2}
                          y={MARGEN.arriba}
                          width={banda}
                          height={altoPlot}
                          fill="#F1F6F3"
                        />
                      )}
                      {modo === "apilado"
                        ? series.map((s, j) => {
                            const valor = s.valores[i];
                            if (!valor) return null;
                            const base = acumulado;
                            acumulado += valor;
                            const superior = !series.slice(j + 1).some((otra) => otra.valores[i]);
                            const arriba = y(acumulado);
                            // 2px surface gap between stacked segments
                            const alto = y(base) - arriba - (base > 0 ? SEPARACION : 0);
                            return (
                              <path
                                key={s.clave}
                                d={barra(centro - anchoBarra / 2, arriba, anchoBarra, alto, superior)}
                                fill={s.color}
                              />
                            );
                          })
                        : series.map((s, j) => {
                            const grupo = anchoBarra * series.length + SEPARACION * (series.length - 1);
                            const x = centro - grupo / 2 + j * (anchoBarra + SEPARACION);
                            const arriba = y(s.valores[i]);
                            return (
                              <path
                                key={s.clave}
                                d={barra(x, arriba, anchoBarra, y(0) - arriba, true)}
                                fill={s.color}
                              />
                            );
                          })}
                      {i % saltoEtiqueta === (meses.length - 1) % saltoEtiqueta && (
                        <text x={centro} y={ALTO - 8} textAnchor="middle" fontSize={11} fill="#7D8E86">
                          {mesCorto(mes)}
                        </text>
                      )}
                      {/* Hit target: the whole column band */}
                      <rect
                        x={centro - banda / 2}
                        y={MARGEN.arriba}
                        width={banda}
                        height={altoPlot}
                        fill="transparent"
                        tabIndex={0}
                        aria-label={`${mesLargo(mes)}: ${series
                          .map((s) => `${s.nombre} ${formatNumero(s.valores[i])} ${unidad}`)
                          .join(", ")}`}
                        onMouseEnter={() => setActivo(i)}
                        onFocus={() => setActivo(i)}
                        onBlur={() => setActivo(null)}
                        className="outline-none"
                      />
                    </g>
                  );
                })}
              </svg>
            )}
            {activo !== null && (
              <div
                role="tooltip"
                className="pointer-events-none absolute top-0 z-10 min-w-40 rounded-md border border-[#DDE8E2] bg-white px-3 py-2 text-xs shadow-lg"
                style={{
                  left: Math.min(
                    Math.max(MARGEN.izquierda + banda * activo + banda / 2 - 80, 0),
                    Math.max(ancho - 170, 0),
                  ),
                }}
              >
                <p className="mb-1 font-semibold text-[#17251F]">{mesLargo(meses[activo])}</p>
                {series.map((s) => (
                  <p key={s.clave} className="flex items-center justify-between gap-3 text-[#486358]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} aria-hidden />
                      {s.nombre}
                    </span>
                    <span className="tabular-nums text-[#17251F]">
                      {formatNumero(s.valores[activo])} {unidad}
                    </span>
                  </p>
                ))}
                {modo === "apilado" && series.length > 1 && (
                  <p className="mt-1 flex justify-between border-t border-[#EEF3F0] pt-1 font-semibold text-[#17251F]">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatNumero(totales[activo])} {unidad}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
