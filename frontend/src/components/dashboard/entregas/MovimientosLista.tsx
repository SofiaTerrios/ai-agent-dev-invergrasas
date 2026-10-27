"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { connectionNodes, graphqlRequest, PAGE_SIZE, type Connection, type PageInfo } from "@/lib/graphql";
import { puede } from "@/lib/permisos";
import {
  GET_MOVIMIENTOS_QUERY,
  TIPO_MOVIMIENTO_LABEL,
  formatFechaCorta,
  formatNumero,
  type Movimiento,
  type TipoMovimiento,
} from "@/graphql/movimientos";
import MovimientoDetalleModal from "./MovimientoDetalleModal";

export type FiltrosMovimientos = {
  empresaId?: string;
  clienteId?: string;
  tipo?: TipoMovimiento | "";
  productoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
};

type Props = {
  filtros: FiltrosMovimientos;
  token?: string | null;
  rol?: string;
  // Compact view (dashboard home): first page only, no "load more"
  limite?: number;
};

const th = "px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#7D8E86]";

// Empty filters are not sent
const variables = (filtros: FiltrosMovimientos) =>
  Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));

const resumenLineas = (m: Movimiento) =>
  m.lineas
    .map((l) =>
      l.producto
        ? `${l.producto.nombre}${l.cantidad != null ? ` ${formatNumero(l.cantidad)} ${l.unidad_medida ?? ""}` : ""}`
        : `${l.vacios_recibidos} vacíos (${l.tipo_empaque.nombre.toLowerCase()})`,
    )
    .join(" · ");

function Estado({ anulado }: { anulado: boolean }) {
  return anulado ? (
    <span className="rounded-full bg-[#FFF1EE] px-2 py-0.5 text-[11px] font-semibold text-[#C86010]">Anulado</span>
  ) : (
    <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#0F6E56]">Vigente</span>
  );
}

// History of entregas and recolecciones (IG-32)
export default function MovimientosLista({ filtros, token, rol, limite }: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ endCursor: null, hasNextPage: false });
  const [totalCount, setTotalCount] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState<Movimiento | null>(null);
  const clave = JSON.stringify(variables(filtros));

  const fetchPagina = useCallback(
    (after?: string) =>
      graphqlRequest<{ movimientos: Connection<Movimiento> }>(
        GET_MOVIMIENTOS_QUERY,
        { ...JSON.parse(clave), first: limite ?? PAGE_SIZE, after },
        token,
      )
        .then((data) => {
          const page = connectionNodes(data.movimientos);
          setMovimientos((prev) => (after ? [...prev, ...page] : page));
          setPageInfo(data.movimientos.pageInfo);
          setTotalCount(data.movimientos.totalCount);
          setError("");
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar movimientos"))
        .finally(() => {
          setCargando(false);
          setCargandoMas(false);
        }),
    [clave, token, limite],
  );

  useEffect(() => {
    if (token) void fetchPagina();
  }, [token, fetchPagina]);

  if (cargando) return <p className="py-8 text-center text-sm text-[#6B7F75]">Cargando movimientos...</p>;

  return (
    <div className="space-y-3">
      <FormError message={error} />
      {movimientos.length === 0 ? (
        <p className="rounded-lg border border-[#DDE8E2] bg-white py-8 text-center text-sm text-[#6B7F75]">
          No hay entregas ni recolecciones para mostrar.
        </p>
      ) : (
        <>
          {!limite && <p className="text-sm text-[#6B7F75]">{totalCount} movimientos</p>}
          <div className="hidden overflow-x-auto rounded-lg border border-[#DDE8E2] bg-white lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#DDE8E2] bg-[#F8FBF9]">
                  <th className={th}>Fecha</th>
                  <th className={th}>N.º</th>
                  <th className={th}>Tipo</th>
                  <th className={th}>Cliente</th>
                  <th className={th}>Detalle</th>
                  <th className={th}>Entregó</th>
                  <th className={th}>Recibió</th>
                  <th className={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setDetalle(m)}
                    className={`cursor-pointer border-b border-[#EEF3F0] text-sm last:border-0 hover:bg-[#F8FBF9] ${
                      m.anulado ? "text-[#8A9A93]" : "text-[#17251F]"
                    }`}
                  >
                    <td className="px-3 py-3 whitespace-nowrap">{formatFechaCorta(m.fecha)}</td>
                    <td className="px-3 py-3 font-mono whitespace-nowrap">
                      <button type="button" className="hover:underline" onClick={() => setDetalle(m)}>
                        {m.numero_formateado}
                      </button>
                    </td>
                    <td className="px-3 py-3">{TIPO_MOVIMIENTO_LABEL[m.tipo]}</td>
                    <td className="px-3 py-3 font-semibold">{m.snapshot.cliente.razon_social}</td>
                    <td className="max-w-xs px-3 py-3 text-xs text-[#486358]">{resumenLineas(m)}</td>
                    <td className="px-3 py-3">{m.snapshot.conductor.nombre}</td>
                    <td className="px-3 py-3">{m.snapshot.contacto?.nombre ?? "—"}</td>
                    <td className="px-3 py-3">
                      <Estado anulado={m.anulado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 lg:hidden">
            {movimientos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setDetalle(m)}
                className="block w-full space-y-1 rounded-lg border border-[#DDE8E2] bg-white p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-[#17251F]">
                    {m.snapshot.cliente.razon_social}
                  </p>
                  <Estado anulado={m.anulado} />
                </div>
                <p className="text-xs text-[#6B7F75]">
                  {TIPO_MOVIMIENTO_LABEL[m.tipo]} · N.º {m.numero_formateado} · {formatFechaCorta(m.fecha)}
                </p>
                <p className="text-xs text-[#83948D]">{resumenLineas(m)}</p>
              </button>
            ))}
          </div>
          {!limite && pageInfo.hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                className="w-auto px-8"
                isLoading={cargandoMas}
                onClick={() => {
                  setCargandoMas(true);
                  void fetchPagina(pageInfo.endCursor ?? undefined);
                }}
              >
                Cargar más ({movimientos.length} de {totalCount})
              </Button>
            </div>
          )}
        </>
      )}

      {detalle && (
        <MovimientoDetalleModal
          key={detalle.id}
          movimiento={detalle}
          token={token}
          puedeAnular={puede(rol, "movimientos", "anular")}
          onClose={() => setDetalle(null)}
          onAnulado={() => {
            setDetalle(null);
            setCargando(true);
            void fetchPagina();
          }}
        />
      )}
    </div>
  );
}
