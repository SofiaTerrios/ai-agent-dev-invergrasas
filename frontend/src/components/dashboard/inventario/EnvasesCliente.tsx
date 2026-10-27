"use client";

import { useEffect, useState } from "react";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import {
  GET_HISTORIAL_ENVASES_QUERY,
  GET_SALDOS_QUERY,
  TIPO_MOVIMIENTO_LABEL,
  formatFechaCorta,
  type MovimientoInventario,
  type SaldoEnvase,
} from "@/graphql/movimientos";

type Props = { clienteId: string; token?: string | null };

// Envases of one cliente: balance and latest movements (IG-31)
export default function EnvasesCliente({ clienteId, token }: Props) {
  const [saldos, setSaldos] = useState<SaldoEnvase[] | null>(null);
  const [historial, setHistorial] = useState<MovimientoInventario[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    graphqlRequest<{ inventarioEnvases: SaldoEnvase[] }>(GET_SALDOS_QUERY, { clienteId }, token)
      .then((d) => setSaldos(d.inventarioEnvases))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar"));
    graphqlRequest<{ historialEnvases: MovimientoInventario[] }>(GET_HISTORIAL_ENVASES_QUERY, { clienteId }, token)
      .then((d) => setHistorial(d.historialEnvases))
      .catch(() => setHistorial([]));
  }, [clienteId, token]);

  return (
    <div className="space-y-5">
      <FormError message={error} />
      <div className="flex flex-wrap gap-3">
        {saldos === null ? (
          <p className="text-sm text-[#6B7F75]">Cargando...</p>
        ) : saldos.length === 0 ? (
          <p className="text-sm text-[#6B7F75]">Este cliente no tiene envases de Invergrasas.</p>
        ) : (
          saldos.map((s) => (
            <div key={s.tipo_empaque.id} className="min-w-32 rounded-lg border border-[#DDE8E2] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7D8E86]">{s.tipo_empaque.nombre}</p>
              <p className={`mt-2 text-3xl font-black ${s.saldo < 0 ? "text-[#C86010]" : "text-[#17251F]"}`}>{s.saldo}</p>
            </div>
          ))
        )}
      </div>
      {saldos?.some((s) => s.saldo < 0) && (
        <p className="text-xs text-[#8A5A00]">
          Un saldo negativo indica que se recogieron más envases de los registrados: falta cargar el
          saldo inicial (Inventario).
        </p>
      )}
      {historial.length > 0 && (
        <ul className="divide-y divide-[#EEF3F0] rounded-lg border border-[#DDE8E2] bg-white text-sm">
          {historial.map((h) => (
            <li key={h.id} className={`flex flex-wrap justify-between gap-2 px-4 py-2 ${h.anulado ? "text-[#8A9A93] line-through" : ""}`}>
              <span>
                {formatFechaCorta(h.fecha)} ·{" "}
                {h.movimiento_numero
                  ? `${TIPO_MOVIMIENTO_LABEL[h.movimiento_tipo!]} N.º ${h.movimiento_numero}`
                  : `Ajuste: ${h.motivo}`}
              </span>
              <span className="font-semibold">
                {h.cantidad > 0 ? "+" : ""}
                {h.cantidad} {h.tipo_empaque.nombre.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
