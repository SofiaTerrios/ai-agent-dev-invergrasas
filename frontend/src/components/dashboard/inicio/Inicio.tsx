"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FormError from "@/components/ui/FormError";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import MovimientosRecientes from "@/components/dashboard/entregas/MovimientosRecientes";
import { graphqlRequest } from "@/lib/graphql";
import { useSession } from "@/lib/session";
import { puede } from "@/lib/permisos";
import { formatNumero, hoyEnBogota } from "@/graphql/movimientos";
import {
  GET_DASHBOARD_QUERY,
  rangoFechas,
  type Comparacion,
  type DashboardResumen,
} from "@/graphql/dashboard";
import GraficaColumnas, { type Serie } from "./GraficaColumnas";

// Categorical slots in fixed order (validated palette); a 7th product folds into "Otros"
const COLORES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
const COLOR_OTROS = "#8B9A93";

type PeriodoId = "mes" | "mes_anterior" | "90_dias" | "anio";

const PERIODOS: { id: PeriodoId; label: string }[] = [
  { id: "mes", label: "Mes en curso" },
  { id: "mes_anterior", label: "Mes anterior" },
  { id: "90_dias", label: "Últimos 90 días" },
  { id: "anio", label: "Año en curso" },
];

const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

// Dates sent to the API; "mes" lets the API compare with the same days of last month
function rango(periodo: PeriodoId): { desde?: string; hasta?: string } {
  const hoy = hoyEnBogota();
  if (periodo === "mes_anterior") {
    const hasta = sumarDias(`${hoy.slice(0, 7)}-01`, -1);
    return { desde: `${hasta.slice(0, 7)}-01`, hasta };
  }
  if (periodo === "90_dias") return { desde: sumarDias(hoy, -89), hasta: hoy };
  if (periodo === "anio") return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy };
  return {};
}

function saludo() {
  const hora = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Bogota" }).format(
      new Date(),
    ),
  );
  return hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
}

function Variacion({ valor, anterior }: { valor: Comparacion; anterior: string }) {
  if (valor.anterior === 0) {
    return (
      <p className="text-xs text-[#7D8E86]">
        {valor.actual === 0 ? "Sin cambios" : "Sin datos"} frente a {anterior}
      </p>
    );
  }
  const cambio = ((valor.actual - valor.anterior) / valor.anterior) * 100;
  const flecha = cambio > 0 ? "▲" : cambio < 0 ? "▼" : "■";
  return (
    <p className="text-xs text-[#63766D]">
      <span className="font-semibold text-[#17251F]">
        <span aria-hidden>{flecha} </span>
        {cambio > 0 ? "+" : ""}
        {formatNumero(Math.round(cambio))} %
      </span>{" "}
      frente a {anterior} ({formatNumero(valor.anterior)})
    </p>
  );
}

function Indicador({
  titulo,
  valor,
  unidad,
  children,
}: {
  titulo: string;
  valor: number;
  unidad?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="flex min-h-36 flex-col gap-2 border border-[#DDE8E2] bg-white p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#7D8E86]">{titulo}</h2>
      <p className="text-3xl font-bold text-[#17251F]">
        {formatNumero(valor)}
        {unidad && <span className="ml-1 text-base font-semibold text-[#63766D]">{unidad}</span>}
      </p>
      <div className="mt-auto space-y-1">{children}</div>
    </article>
  );
}

function seriesKg(datos: NonNullable<DashboardResumen["serie_kg"]>, meses: string[]): Serie[] {
  const productos = [...new Set(datos.map((d) => d.producto))].sort((a, b) => a.localeCompare(b, "es"));
  const propios = productos.slice(0, productos.length > COLORES.length ? COLORES.length - 1 : COLORES.length);
  const valores = (filtro: (producto: string) => boolean) =>
    meses.map((mes) =>
      datos.filter((d) => d.mes === mes && filtro(d.producto)).reduce((suma, d) => suma + d.kg, 0),
    );
  const series = propios.map((producto, i) => ({
    clave: producto,
    nombre: producto,
    color: COLORES[i],
    valores: valores((p) => p === producto),
  }));
  if (propios.length < productos.length) {
    series.push({ clave: "otros", nombre: "Otros", color: COLOR_OTROS, valores: valores((p) => !propios.includes(p)) });
  }
  return series;
}

// Home of the dashboard (IG-42): real figures, by the user's permissions
export default function Inicio() {
  const session = useSession();
  const [periodo, setPeriodo] = useState<PeriodoId>("mes");
  const [datos, setDatos] = useState<DashboardResumen | null>(null);
  const [error, setError] = useState("");
  const token = session?.token;

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    graphqlRequest<{ dashboardResumen: DashboardResumen }>(GET_DASHBOARD_QUERY, rango(periodo), token)
      .then((data) => {
        if (!vigente) return;
        setDatos(data.dashboardResumen);
        setError("");
      })
      .catch((err: Error) => vigente && setError(err.message));
    return () => {
      vigente = false;
    };
  }, [token, periodo]);

  if (!session) return null;
  const nombre = session.user.nombre?.split(" ")[0];
  const anterior = datos ? rangoFechas(datos.anterior_desde, datos.anterior_hasta) : "";
  // Both series share the 12 months of the API
  const mesesSerie = datos?.serie_envases?.map((m) => m.mes) ?? [];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDE8E2] pb-6">
        <div>
          <p className="text-sm font-semibold text-[#0F6E2E]">Lo que mueve la industria, lo mueve Invergrasas</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#17251F] md:text-4xl">
            {saludo()}
            {nombre ? `, ${nombre}` : ""}
          </h1>
          {datos && (
            <p className="mt-1 text-sm text-[#63766D]">
              Resumen del {rangoFechas(datos.desde, datos.hasta)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {puede(session.user.rol, "movimientos", "crear") && (
              <Link
                href="/dashboard/entregas/nueva"
                className="rounded-md bg-[#0F6E2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5A25]"
              >
                Nueva entrega o recolección
              </Link>
            )}
            {puede(session.user.rol, "certificados", "escribir") && (
              <Link
                href="/dashboard/certificados/nuevo"
                className="rounded-md border border-[#0F6E2E] px-4 py-2 text-sm font-semibold text-[#0F6E2E] hover:bg-[#EAF3EE]"
              >
                Nuevo certificado de análisis
              </Link>
            )}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#486358]">
          Período
          <select
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value as PeriodoId)}
            className="h-10 rounded-md border border-[#D5E1DB] bg-white px-3 text-sm font-medium text-[#17251F]"
          >
            {PERIODOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <FormError message={error} />
      {!datos && !error && (
        <div className="grid h-40 place-items-center">
          <LoadingSpinner />
        </div>
      )}

      {datos && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
            {datos.kg_entregados && (
              <Indicador titulo="Kg entregados" valor={datos.kg_entregados.actual} unidad="kg">
                <Variacion valor={datos.kg_entregados} anterior={anterior} />
                <p className="text-xs text-[#7D8E86]">Solo líneas registradas en kg</p>
              </Indicador>
            )}
            {datos.movimientos && (
              <Indicador titulo="Entregas y recolecciones" valor={datos.movimientos.actual}>
                <Variacion valor={datos.movimientos} anterior={anterior} />
                <p className="text-xs text-[#7D8E86]">
                  {formatNumero(datos.movimientos.entregas)} con entrega ·{" "}
                  {formatNumero(datos.movimientos.recolecciones)} con recolección
                </p>
              </Indicador>
            )}
            {datos.certificados && (
              <Indicador titulo="Certificados de análisis" valor={datos.certificados.actual}>
                <Variacion valor={datos.certificados} anterior={anterior} />
                <p className="text-xs text-[#7D8E86]">Emitidos, sin contar anulados</p>
              </Indicador>
            )}
            {datos.envases && (
              <Indicador titulo="Envases en clientes" valor={datos.envases.total}>
                <p className="text-xs text-[#63766D]">
                  {datos.envases.por_tipo.length
                    ? datos.envases.por_tipo
                        .map((t) => `${formatNumero(t.cantidad)} ${t.nombre.toLowerCase()}`)
                        .join(" · ")
                    : "Ningún envase retornable pendiente"}
                </p>
                <p className="text-xs text-[#7D8E86]">Saldo a hoy, sin importar el período</p>
              </Indicador>
            )}
          </section>

          {(datos.serie_kg || datos.serie_envases) && (
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {datos.serie_kg && (
                <GraficaColumnas
                  titulo="Kg entregados por producto"
                  descripcion="Últimos 12 meses, solo líneas en kg"
                  meses={mesesSerie}
                  series={seriesKg(datos.serie_kg, mesesSerie)}
                  modo="apilado"
                  unidad="kg"
                  vacio="Aún no hay entregas en kg en los últimos 12 meses."
                />
              )}
              {datos.serie_envases && (
                <GraficaColumnas
                  titulo="Envases entregados y recogidos"
                  descripcion="Últimos 12 meses, envases retornables"
                  meses={mesesSerie}
                  series={[
                    {
                      clave: "entregados",
                      nombre: "Entregados",
                      color: COLORES[0],
                      valores: datos.serie_envases.map((m) => m.entregados),
                    },
                    {
                      clave: "recogidos",
                      nombre: "Recogidos",
                      color: COLORES[1],
                      valores: datos.serie_envases.map((m) => m.recogidos),
                    },
                  ]}
                  modo="agrupado"
                  unidad="envases"
                  vacio="Aún no hay movimientos de envases retornables en los últimos 12 meses."
                />
              )}
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
            <div className="2xl:col-span-2">
              <MovimientosRecientes />
            </div>
            {datos.top_clientes_envases && (
              <section className="border border-[#DDE8E2] bg-white p-5 shadow-sm" aria-label="Clientes con más envases">
                <div className="flex items-center justify-between border-b border-[#EEF3F0] pb-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#7D8E86]">
                    Clientes con más envases
                  </h2>
                  <Link href="/dashboard/inventario" className="text-sm font-semibold text-[#0F6E2E] hover:underline">
                    Ver inventario
                  </Link>
                </div>
                {datos.top_clientes_envases.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#63766D]">
                    Ningún cliente tiene envases retornables pendientes.
                  </p>
                ) : (
                  <ol className="divide-y divide-[#EEF3F0]">
                    {datos.top_clientes_envases.map((c) => (
                      <li key={c.cliente.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#17251F]">{c.cliente.razon_social}</p>
                          <p className="text-xs text-[#63766D]">{c.detalle}</p>
                        </div>
                        <p className="text-lg font-bold tabular-nums text-[#17251F]">{formatNumero(c.total)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </section>
        </>
      )}
    </div>
  );
}
