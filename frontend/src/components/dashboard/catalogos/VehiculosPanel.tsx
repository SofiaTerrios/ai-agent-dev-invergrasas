"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import Modal from "@/components/ui/Modal";
import { labelClass, selectClass } from "@/components/ui/formStyles";
import { connectionNodes, graphqlRequest, type Connection } from "@/lib/graphql";
import type { Empresa } from "@/graphql/empresas";
import { GET_CLIENTES_QUERY, type Cliente } from "@/graphql/clientes";
import {
  CREATE_VEHICULO_MUTATION,
  DELETE_VEHICULO_MUTATION,
  GET_VEHICULOS_QUERY,
  UPDATE_VEHICULO_MUTATION,
  type Vehiculo,
} from "@/graphql/catalogos";

type Props = {
  empresas: Empresa[];
  editable: boolean;
  token?: string | null;
};

type Form = { id?: string; transportador_id: string; placa: string; descripcion: string };

// Vehicles of the transportadores of each empresa (IG-40)
export default function VehiculosPanel({ empresas, editable, token }: Props) {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "");
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [transportadores, setTransportadores] = useState<Cliente[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    if (!empresaId) return;
    graphqlRequest<{ vehiculos: Vehiculo[] }>(GET_VEHICULOS_QUERY, { empresaId }, token)
      .then((data) => setVehiculos(data.vehiculos))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar vehículos"));
    graphqlRequest<{ clientes: Connection<Cliente> }>(
      GET_CLIENTES_QUERY,
      { empresaId, tipo: "TRANSPORTADOR", first: 100 },
      token,
    )
      .then((data) => setTransportadores(connectionNodes(data.clientes)))
      .catch(() => setTransportadores([]));
  }, [empresaId, token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = async (valores: Form) => {
    setGuardando(true);
    setError("");
    const datos = {
      transportador_id: valores.transportador_id,
      placa: valores.placa,
      descripcion: valores.descripcion.trim() || null,
    };
    try {
      if (valores.id) {
        await graphqlRequest(UPDATE_VEHICULO_MUTATION, { id: valores.id, input: datos }, token);
      } else {
        await graphqlRequest(CREATE_VEHICULO_MUTATION, { input: { ...datos, empresa_id: empresaId } }, token);
      }
      setForm(null);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el vehículo.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (vehiculo: Vehiculo) => {
    setError("");
    try {
      await graphqlRequest(DELETE_VEHICULO_MUTATION, { id: vehiculo.id }, token);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el vehículo.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {empresas.length > 1 ? (
          <div className="space-y-1.5 sm:w-72">
            <label htmlFor="vehiculos-empresa" className={labelClass}>
              Empresa
            </label>
            <select
              id="vehiculos-empresa"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className={selectClass}
            >
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razon_social}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span />
        )}
        {editable && (
          <Button
            className="sm:w-auto sm:px-6"
            disabled={transportadores.length === 0}
            title={transportadores.length === 0 ? "Primero marca un cliente como Transportador" : undefined}
            onClick={() =>
              setForm({ transportador_id: transportadores[0]?.id ?? "", placa: "", descripcion: "" })
            }
          >
            + Vehículo
          </Button>
        )}
      </div>
      {transportadores.length === 0 && (
        <p className="text-sm text-[#6B7F75]">
          No hay transportadores: marca la empresa transportadora (p. ej. Invergrasas) con el tipo
          «Transportador» en Clientes.
        </p>
      )}
      <FormError message={form ? "" : error} />
      {vehiculos.length > 0 && (
        <ul className="divide-y divide-[#EEF3F0] rounded-lg border border-[#DDE8E2] bg-white">
          {vehiculos.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-mono text-sm font-bold text-[#17251F]">{v.placa}</p>
                <p className="text-xs text-[#6B7F75]">
                  {[v.transportador.razon_social, v.descripcion].filter(Boolean).join(" · ")}
                </p>
              </div>
              {editable && (
                <span className="flex gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    className="text-[#0F6E2E] hover:underline"
                    onClick={() =>
                      setForm({
                        id: v.id,
                        transportador_id: v.transportador_id,
                        placa: v.placa,
                        descripcion: v.descripcion ?? "",
                      })
                    }
                  >
                    Editar
                  </button>
                  <button type="button" className="text-[#D63A2F] hover:underline" onClick={() => void eliminar(v)}>
                    Eliminar
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {form && (
        <Modal titulo={form.id ? "Editar vehículo" : "Nuevo vehículo"} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="vehiculo-transportador" className={labelClass}>
                Transportador
              </label>
              <select
                id="vehiculo-transportador"
                value={form.transportador_id}
                onChange={(e) => setForm({ ...form, transportador_id: e.target.value })}
                className={selectClass}
              >
                {transportadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.razon_social}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="vehiculo-placa"
              label="Placa"
              placeholder="ABC 123"
              value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
            />
            <Input
              id="vehiculo-descripcion"
              label="Descripción (opcional)"
              placeholder="Ej.: NPR blanco"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
            <FormError message={error} />
            <div className="flex gap-3">
              <Button variant="secondary" className="w-auto px-6" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button
                className="w-auto px-6"
                isLoading={guardando}
                disabled={!form.placa.trim() || !form.transportador_id}
                onClick={() => void guardar(form)}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
