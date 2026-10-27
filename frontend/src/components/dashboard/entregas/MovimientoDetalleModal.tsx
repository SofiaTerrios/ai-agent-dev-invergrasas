"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import Modal from "@/components/ui/Modal";
import { graphqlRequest } from "@/lib/graphql";
import { downloadAuthenticatedFile } from "@/lib/api";
import { formatNit } from "@/graphql/clientes";
import {
  ANULAR_MOVIMIENTO_MUTATION,
  TIPO_MOVIMIENTO_LABEL,
  formatFechaCorta,
  formatNumero,
  type Movimiento,
} from "@/graphql/movimientos";

type Props = {
  movimiento: Movimiento;
  token?: string | null;
  puedeAnular: boolean;
  onClose: () => void;
  onAnulado: () => void;
};

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7D8E86]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#17251F]">{value || "—"}</dd>
    </div>
  );
}

export default function MovimientoDetalleModal({ movimiento: m, token, puedeAnular, onClose, onAnulado }: Props) {
  const [error, setError] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const { snapshot: s } = m;

  const descargar = async () => {
    if (!token) return;
    setError("");
    try {
      await downloadAuthenticatedFile(m.archivo_url, token, `certificado-${m.numero_formateado}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el PDF");
    }
  };

  const anular = async () => {
    setGuardando(true);
    setError("");
    try {
      await graphqlRequest(ANULAR_MOVIMIENTO_MUTATION, { id: m.id, motivo }, token);
      onAnulado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={`${TIPO_MOVIMIENTO_LABEL[m.tipo]} N.º ${m.numero_formateado}`} onClose={onClose} ancho="2xl">
      <div className="space-y-5">
        {m.anulado && (
          <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF1EE] p-4 text-sm text-[#8A3B1F]">
            <p className="font-bold">Anulado</p>
            <p className="mt-1">Motivo: {m.motivo_anulacion}</p>
            <p className="mt-1 text-xs">
              {m.anulado_por_nombre}
              {m.anulado_at ? ` · ${formatFechaCorta(m.anulado_at)}` : ""}
            </p>
          </div>
        )}
        {m.migrado && (
          <p className="rounded-lg bg-[#F1F6F3] p-3 text-xs text-[#486358]">
            Registro migrado de los pedidos anteriores: no tiene contacto, transportador ni envases.
          </p>
        )}

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Dato label="Fecha" value={formatFechaCorta(m.fecha)} />
          <Dato label="Cliente" value={s.cliente.razon_social} />
          <Dato label="NIT" value={formatNit(s.cliente.nit, s.cliente.dv)} />
          <Dato label="Sede" value={s.sede?.nombre} />
          <Dato label="Dirección" value={[s.sede?.direccion, s.sede?.ciudad].filter(Boolean).join(", ")} />
          <Dato
            label={m.tipo === "RECOLECCION" ? "Entregó" : "Recibió"}
            value={s.contacto ? [s.contacto.nombre, s.contacto.cargo].filter(Boolean).join(" — ") : null}
          />
          <Dato label="Conductor" value={s.conductor.nombre} />
          <Dato label="Placa" value={s.vehiculo?.placa} />
          <Dato label="Transportador" value={s.transportador?.razon_social} />
        </dl>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DDE8E2] bg-[#F8FBF9] text-left text-xs text-[#345247]">
                <th className="px-2 py-2">Producto</th>
                <th className="px-2 py-2 text-right">Cantidad</th>
                <th className="px-2 py-2">Envase</th>
                <th className="px-2 py-2 text-right">Llenos</th>
                <th className="px-2 py-2 text-right">Vacíos rec.</th>
                <th className="px-2 py-2 text-right">Vacíos ent.</th>
              </tr>
            </thead>
            <tbody>
              {m.lineas.map((l) => (
                <tr key={l.id} className="border-b border-[#EEF3F0]">
                  <td className="px-2 py-2">{l.producto?.nombre ?? "—"}</td>
                  <td className="px-2 py-2 text-right">
                    {l.cantidad != null ? `${formatNumero(l.cantidad)} ${l.unidad_medida ?? ""}` : "—"}
                  </td>
                  <td className="px-2 py-2">{l.tipo_empaque.nombre}</td>
                  <td className="px-2 py-2 text-right">{l.cantidad_envases}</td>
                  <td className="px-2 py-2 text-right">{l.vacios_recibidos}</td>
                  <td className="px-2 py-2 text-right">{l.vacios_entregados}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {m.total_kg > 0 && (
            <p className="mt-2 text-right text-sm font-semibold text-[#17251F]">
              Total: {formatNumero(m.total_kg)} kg
            </p>
          )}
        </div>
        {m.observacion && <p className="text-sm text-[#486358]">Observación: {m.observacion}</p>}

        {anulando && (
          <div className="space-y-2 rounded-lg border border-[#DDE8E2] p-4">
            <label htmlFor="motivo-anulacion" className="block text-sm font-medium text-[#1B4D1E]">
              Motivo de la anulación
            </label>
            <textarea
              id="motivo-anulacion"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-lg border border-[#CFE0D2] px-3 py-2 text-sm"
            />
            <p className="text-xs text-[#83948D]">
              El recibo, su número y su PDF se conservan marcados como ANULADO, y deja de contar en el
              inventario de envases.
            </p>
          </div>
        )}

        <FormError message={error} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="sm:w-auto sm:px-6" onClick={() => void descargar()}>
            Descargar PDF
          </Button>
          {puedeAnular && !m.anulado && !anulando && (
            <Button variant="secondary" className="sm:w-auto sm:px-6" onClick={() => setAnulando(true)}>
              Anular
            </Button>
          )}
          {anulando && (
            <button
              type="button"
              disabled={motivo.trim().length < 5 || guardando}
              onClick={() => void anular()}
              className="inline-flex items-center justify-center rounded-lg bg-[#D63A2F] px-6 py-2.5 font-semibold text-white hover:bg-[#B52E25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? "Anulando..." : "Confirmar anulación"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
