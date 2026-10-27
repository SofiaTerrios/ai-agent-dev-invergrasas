"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { fetchAllNodes, graphqlRequest } from "@/lib/graphql";
import { GET_USUARIOS_QUERY, type Usuario } from "@/graphql/usuarios";
import { ASIGNAR_FIRMANTE_MUTATION, type Firmante } from "@/graphql/certificados";

type Props = {
  firmante: Firmante | null | undefined;
  // Super admin only: lets them pick who signs
  editable: boolean;
  token?: string | null;
  onChange: (firmante: Firmante) => void;
};

const selectClass =
  "w-full rounded-lg border border-[#CFE0D2] bg-white px-3 py-2 text-sm text-[#3A3A3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4A017]";

// Who signs every certificado de análisis (IG-21)
export default function FirmanteCard({ firmante, editable, token, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [candidatos, setCandidatos] = useState<Usuario[] | null>(null);
  const [seleccion, setSeleccion] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editing || !token) return;
    fetchAllNodes<Usuario>(GET_USUARIOS_QUERY, "usuarios", {}, token)
      .then((usuarios) => setCandidatos(usuarios.filter((u) => u.tiene_firma)))
      .catch(() => setCandidatos([]));
  }, [editing, token]);

  if (firmante === undefined) return null;

  const guardar = async () => {
    setIsSaving(true);
    setError("");
    try {
      const data = await graphqlRequest<{ asignarFirmanteCertificados: Firmante }>(
        ASIGNAR_FIRMANTE_MUTATION,
        { userId: seleccion },
        token,
      );
      onChange(data.asignarFirmanteCertificados);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo asignar la firmante.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 ${
        firmante ? "border-[#DDE8E2] bg-white" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
            Firmante de los certificados
          </p>
          <p className="mt-1 text-sm font-semibold text-[#17251F]">
            {firmante
              ? firmante.nombre
              : "Sin configurar: no se pueden generar certificados."}
          </p>
        </div>
        {editable && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-[#0F6E2E] hover:underline"
          >
            {firmante ? "Cambiar" : "Asignar"}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 space-y-3">
          {candidatos === null ? (
            <p className="text-sm text-[#6B7F75]">Cargando usuarios...</p>
          ) : candidatos.length === 0 ? (
            <p className="text-sm text-[#6B7F75]">
              Ningún usuario tiene imagen de firma. Súbela en Usuarios.
            </p>
          ) : (
            <select
              aria-label="Firmante"
              value={seleccion}
              onChange={(e) => setSeleccion(e.target.value)}
              className={selectClass}
            >
              <option value="">Selecciona quién firma</option>
              {candidatos.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.email})
                </option>
              ))}
            </select>
          )}
          <FormError message={error} />
          <div className="flex gap-3">
            <Button variant="secondary" className="w-auto px-6" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button
              className="w-auto px-6"
              disabled={!seleccion}
              isLoading={isSaving}
              onClick={() => void guardar()}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
