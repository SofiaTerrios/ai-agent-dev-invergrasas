"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import Modal from "@/components/ui/Modal";
import { graphqlRequest } from "@/lib/graphql";
import type { ActividadEconomica } from "@/graphql/catalogos";
import {
  CREATE_SEDE_MUTATION,
  DELETE_SEDE_MUTATION,
  UPDATE_SEDE_MUTATION,
  type Cliente,
  type Sede,
} from "@/graphql/clientes";
import SedeCampos, { SEDE_VACIA, sedeInput, validarSede, type SedeValores } from "./SedeCampos";

type Props = {
  cliente: Cliente;
  actividades: ActividadEconomica[];
  token?: string | null;
  puedeEditar: boolean;
  onCambio: () => void;
};

const valoresDe = (sede: Sede): SedeValores => ({
  nombre: sede.nombre,
  direccion: sede.direccion ?? "",
  ciudad: sede.ciudad,
  actividad_economica_id: sede.actividad_economica?.id ?? "",
  telefono: sede.telefono ?? "",
  barrio: sede.barrio ?? "",
  localidad: sede.localidad ?? "",
  email: sede.email ?? "",
});

// Locales of the cliente (IG-37)
export default function SedesPanel({ cliente, actividades, token, puedeEditar, onCambio }: Props) {
  // undefined: closed; null: new sede
  const [editando, setEditando] = useState<Sede | null | undefined>(undefined);
  const [valores, setValores] = useState<SedeValores>(SEDE_VACIA);
  const [errores, setErrores] = useState<Partial<Record<keyof SedeValores, string>>>({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrir = (sede: Sede | null) => {
    setEditando(sede);
    setValores(sede ? valoresDe(sede) : SEDE_VACIA);
    setErrores({});
    setError("");
  };

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setGuardando(true);
    setError("");
    try {
      await accion();
      setEditando(undefined);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la sede.");
    } finally {
      setGuardando(false);
    }
  };

  const guardar = () => {
    const nuevos = validarSede(valores);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    void ejecutar(() =>
      editando
        ? graphqlRequest(UPDATE_SEDE_MUTATION, { id: editando.id, input: sedeInput(valores) }, token)
        : graphqlRequest(
            CREATE_SEDE_MUTATION,
            { input: { ...sedeInput(valores), cliente_id: cliente.id } },
            token,
          ),
    );
  };

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <div className="flex justify-end">
          <Button className="w-auto px-6" onClick={() => abrir(null)}>
            + Agregar sede
          </Button>
        </div>
      )}
      <FormError message={editando === undefined ? error : ""} />
      <ul className="space-y-3">
        {cliente.sedes.map((sede) => (
          <li key={sede.id} className="rounded-lg border border-[#DDE8E2] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#17251F]">
                  {sede.nombre}
                  {sede.principal && (
                    <span className="ml-2 rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#0F6E56]">
                      Principal
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-[#6B7F75]">
                  {[sede.direccion ?? "Dirección pendiente", sede.barrio, sede.localidad, sede.ciudad?.nombre]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="text-xs text-[#83948D]">
                  {[sede.actividad_economica?.nombre, sede.telefono, sede.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              {puedeEditar && (
                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  <button type="button" className="text-[#0F6E2E] hover:underline" onClick={() => abrir(sede)}>
                    Editar
                  </button>
                  {!sede.principal && (
                    <>
                      <button
                        type="button"
                        className="text-[#2F6FB0] hover:underline"
                        onClick={() =>
                          void ejecutar(() =>
                            graphqlRequest(UPDATE_SEDE_MUTATION, { id: sede.id, input: { principal: true } }, token),
                          )
                        }
                      >
                        Marcar principal
                      </button>
                      <button
                        type="button"
                        className="text-[#D63A2F] hover:underline"
                        onClick={() =>
                          void ejecutar(() => graphqlRequest(DELETE_SEDE_MUTATION, { id: sede.id }, token))
                        }
                      >
                        Desactivar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {editando !== undefined && (
        <Modal titulo={editando ? "Editar sede" : "Nueva sede"} onClose={() => setEditando(undefined)} ancho="2xl">
          <div className="space-y-4">
            <SedeCampos
              prefijo="sede"
              valores={valores}
              errores={errores}
              actividades={actividades}
              onChange={(cambios) => setValores((prev) => ({ ...prev, ...cambios }))}
              token={token}
              disabled={guardando}
            />
            <FormError message={error} />
            <div className="flex gap-3">
              <Button variant="secondary" className="w-auto px-6" onClick={() => setEditando(undefined)}>
                Cancelar
              </Button>
              <Button className="w-auto px-6" isLoading={guardando} onClick={guardar}>
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
