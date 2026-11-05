"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import {
  GET_TEXTOS_QUERY,
  TIPO_MOVIMIENTO_LABEL,
  UPDATE_TEXTO_MUTATION,
  type TipoMovimiento,
} from "@/graphql/movimientos";

type Texto = { tipo: TipoMovimiento; texto: string };

// Certifying paragraph per kind of certificado (IG-28), super admin only.
// Each certificado keeps the text in force when it was issued.
export default function TextosCertificador({ token }: { token?: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [textos, setTextos] = useState<Texto[]>([]);
  const [guardado, setGuardado] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto || !token) return;
    graphqlRequest<{ textosCertificador: Texto[] }>(GET_TEXTOS_QUERY, {}, token)
      .then((d) => setTextos(d.textosCertificador))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar"));
  }, [abierto, token]);

  const guardar = async ({ tipo, texto }: Texto) => {
    setError("");
    setGuardado("");
    try {
      await graphqlRequest(UPDATE_TEXTO_MUTATION, { tipo, texto }, token);
      setGuardado(tipo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  };

  return (
    <div className="rounded-lg border border-[#DDE8E2] bg-white p-4">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="text-sm font-semibold text-[#0F6E2E] hover:underline"
        aria-expanded={abierto}
      >
        {abierto ? "▾" : "▸"} Textos del certificado
      </button>
      {abierto && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-[#83948D]">
            El texto legal lo define el negocio. Los certificados ya emitidos conservan el texto con
            el que salieron.
          </p>
          {textos.map((t) => (
            <div key={t.tipo} className="space-y-2">
              <label htmlFor={`texto-${t.tipo}`} className="block text-sm font-medium text-[#1B4D1E]">
                {TIPO_MOVIMIENTO_LABEL[t.tipo]}
              </label>
              <textarea
                id={`texto-${t.tipo}`}
                rows={3}
                value={t.texto}
                onChange={(e) =>
                  setTextos((prev) => prev.map((x) => (x.tipo === t.tipo ? { ...x, texto: e.target.value } : x)))
                }
                className="w-full rounded-lg border border-[#CFE0D2] px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-3">
                <Button variant="secondary" className="w-auto px-4" onClick={() => void guardar(t)}>
                  Guardar
                </Button>
                {guardado === t.tipo && <span className="text-xs text-[#0F6E56]">Guardado</span>}
              </div>
            </div>
          ))}
          <FormError message={error} />
        </div>
      )}
    </div>
  );
}
