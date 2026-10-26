"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import { downloadAuthenticatedFile } from "@/lib/api";
import {
  ANULAR_CERTIFICADO_MUTATION,
  GET_CERTIFICADO_QUERY,
  TIPO_LABELS,
  formatFecha,
  type CertificadoDetalle,
} from "@/graphql/certificados";

type Props = {
  certificadoId: string;
  token?: string | null;
  puedeAnular: boolean;
  puedeGenerar: boolean;
  onClose: () => void;
  onAnulado: () => void;
};

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7D8E86]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#17251F]">{value || "—"}</dd>
    </div>
  );
}

export default function CertificadoDetalleModal({
  certificadoId,
  token,
  puedeAnular,
  puedeGenerar,
  onClose,
  onAnulado,
}: Props) {
  const [certificado, setCertificado] = useState<CertificadoDetalle | null>(null);
  const [error, setError] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    graphqlRequest<{ certificado: CertificadoDetalle }>(
      GET_CERTIFICADO_QUERY,
      { id: certificadoId },
      token,
    )
      .then((data) => setCertificado(data.certificado))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar el certificado"),
      );
  }, [certificadoId, token]);

  const descargar = async () => {
    if (!certificado?.archivo_url || !token) return;
    setError("");
    try {
      await downloadAuthenticatedFile(
        certificado.archivo_url,
        token,
        `certificado-${certificado.lote}.pdf`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el PDF");
    }
  };

  const anular = async () => {
    setIsSaving(true);
    setError("");
    try {
      await graphqlRequest(ANULAR_CERTIFICADO_MUTATION, { id: certificadoId, motivo }, token);
      onAnulado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo anular el certificado");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#17251F]/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#DDE8E2] bg-white shadow-lg">
          <div className="sticky top-0 flex items-center justify-between border-b border-[#DDE8E2] bg-white px-6 py-4">
            <h2 className="text-lg font-bold text-[#17251F]">
              Certificado {certificado ? `· Lote ${certificado.lote}` : ""}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7F75] hover:bg-[#F1F6F3]"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="space-y-6 px-6 py-5">
            {!certificado ? (
              error ? <FormError message={error} /> : (
                <p className="text-sm text-[#6B7F75]">Cargando...</p>
              )
            ) : (
              <>
                {certificado.anulado && (
                  <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF1EE] p-4 text-sm text-[#8A3B1F]">
                    <p className="font-bold">Anulado</p>
                    <p className="mt-1">Motivo: {certificado.motivo_anulacion}</p>
                    <p className="mt-1 text-xs">
                      {certificado.anulado_por_nombre} ·{" "}
                      {certificado.anulado_at && formatFecha(certificado.anulado_at)}
                    </p>
                  </div>
                )}

                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Dato label="Tipo" value={TIPO_LABELS[certificado.tipo]} />
                  <Dato label="Emisión" value={formatFecha(certificado.fecha_emision)} />
                  <Dato
                    label="Vencimiento"
                    value={formatFecha(certificado.fecha_vencimiento, true)}
                  />
                  <Dato label="Cliente" value={certificado.empresa_cliente} />
                  <Dato label="NIT" value={certificado.nit_cliente} />
                  <Dato label="Empresa" value={certificado.empresa?.razon_social} />
                  <Dato label="Lote" value={certificado.lote} />
                  {certificado.tipo === "rbd" && (
                    <Dato
                      label="Peso"
                      value={
                        certificado.peso_kg != null
                          ? `${certificado.peso_kg.toLocaleString("es-CO")} kg`
                          : null
                      }
                    />
                  )}
                  <Dato label="Firmado por" value={certificado.firmado_por} />
                </dl>

                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#DDE8E2] bg-[#F8FBF9] text-left">
                      <th className="px-3 py-2 font-semibold text-[#345247]">Característica</th>
                      <th className="px-3 py-2 text-right font-semibold text-[#345247]">
                        Resultado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificado.parametros.map((p) => (
                      <tr key={p.nombre} className="border-b border-[#EEF3F0]">
                        <td className="px-3 py-2 text-[#17251F]">{p.nombre}</td>
                        <td className="px-3 py-2 text-right text-[#17251F]">
                          {p.valor.replace(".", ",")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(certificado.reemplaza_id || certificado.reemplazado_por_id) && (
                  <p className="text-sm text-[#6B7F75]">
                    {certificado.reemplaza_id
                      ? "Este certificado corrige uno anulado."
                      : "Este certificado ya fue reemitido con un certificado corregido."}
                  </p>
                )}

                {anulando && (
                  <div className="space-y-2 rounded-lg border border-[#DDE8E2] p-4">
                    <label htmlFor="motivo" className="block text-sm font-medium text-[#1B4D1E]">
                      Motivo de la anulación
                    </label>
                    <textarea
                      id="motivo"
                      rows={3}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="w-full rounded-lg border border-[#CFE0D2] px-3 py-2 text-sm"
                      placeholder="Ej.: lote equivocado"
                    />
                    <p className="text-xs text-[#83948D]">
                      El certificado y su PDF se conservan, marcados como anulados.
                    </p>
                  </div>
                )}

                <FormError message={error} />

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {certificado.archivo_url && (
                    <Button className="sm:w-auto sm:px-6" onClick={() => void descargar()}>
                      Descargar PDF
                    </Button>
                  )}
                  {puedeAnular && !certificado.anulado && !anulando && (
                    <Button
                      variant="secondary"
                      className="sm:w-auto sm:px-6"
                      onClick={() => setAnulando(true)}
                    >
                      Anular
                    </Button>
                  )}
                  {anulando && (
                    <button
                      type="button"
                      disabled={motivo.trim().length < 5 || isSaving}
                      onClick={() => void anular()}
                      className="inline-flex items-center justify-center rounded-lg bg-[#D63A2F] px-6 py-2.5 font-semibold text-white transition hover:bg-[#B52E25] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Anulando..." : "Confirmar anulación"}
                    </button>
                  )}
                  {puedeGenerar && certificado.anulado && !certificado.reemplazado_por_id && (
                    <Link
                      href={`/dashboard/certificados/nuevo?reemplaza=${certificado.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-[#1A8A3A] px-6 py-2.5 font-semibold text-[#0F6E2E] hover:bg-[#F2FAF4]"
                    >
                      Duplicar y corregir
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
