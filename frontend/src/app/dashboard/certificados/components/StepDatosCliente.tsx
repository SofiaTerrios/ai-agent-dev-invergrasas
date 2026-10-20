"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import { fetchAllNodes } from "@/lib/graphql";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { GET_CLIENTES_BY_EMPRESA_QUERY, type Cliente } from "@/graphql/clientes";

type DatosCliente = {
  empresa_id?: string;
  cliente_id?: string;
  empresa_cliente?: string;
  nit_cliente?: string;
};

interface StepDatosClienteProps {
  token: string | null;
  empresa_id: string;
  cliente_id: string;
  empresa_cliente: string;
  nit_cliente: string;
  onChange: (newData: DatosCliente) => void;
  errors: Record<string, string>;
}

const selectClassName =
  "w-full rounded-lg border border-[#CFE0D2] bg-white px-3 py-2.5 text-[#3A3A3A] shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017] disabled:bg-[#F8FBF9]";

export default function StepDatosCliente({
  token,
  empresa_id,
  cliente_id,
  empresa_cliente,
  nit_cliente,
  onChange,
  errors,
}: StepDatosClienteProps) {
  // null while loading
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  // Clientes are kept with the empresa they were loaded for
  const [clientesState, setClientesState] = useState<{
    empresaId: string;
    list: Pick<Cliente, "id" | "nombre">[];
  }>({ empresaId: "", list: [] });
  const loadingEmpresas = empresas === null;
  const clientes = clientesState.empresaId === empresa_id ? clientesState.list : [];

  useEffect(() => {
    if (!token) return;
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token)
      .then(setEmpresas)
      .catch((err) => {
        console.error("Error loading empresas:", err);
        setEmpresas([]);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !empresa_id) return;
    fetchAllNodes<Cliente>(
      GET_CLIENTES_BY_EMPRESA_QUERY,
      "clientesByEmpresa",
      { empresaId: empresa_id },
      token,
    )
      .then((list) => setClientesState({ empresaId: empresa_id, list }))
      .catch((err) => console.error("Error loading clientes:", err));
  }, [token, empresa_id]);

  const onSelectCliente = (id: string) => {
    const cliente = clientes.find((c) => c.id === id);
    onChange({ cliente_id: id, ...(cliente ? { empresa_cliente: cliente.nombre } : {}) });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#17251F]">Datos del cliente</h2>
        <p className="mt-1 text-sm text-[#6B7F75]">
          Ingresa la información de la empresa destinataria
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="empresa_id" className="block text-sm font-medium text-[#1B4D1E]">
            Empresa emisora
          </label>
          <select
            id="empresa_id"
            value={empresa_id}
            onChange={(e) => onChange({ empresa_id: e.target.value, cliente_id: "" })}
            disabled={loadingEmpresas}
            className={`${selectClassName} ${errors.empresa_id ? "border-red-500" : ""}`}
            required
          >
            <option value="">
              {loadingEmpresas ? "Cargando empresas..." : "Selecciona una empresa"}
            </option>
            {(empresas ?? []).map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razon_social}
              </option>
            ))}
          </select>
          {errors.empresa_id && <p className="text-xs text-red-600">{errors.empresa_id}</p>}
        </div>

        {clientes.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="cliente_id" className="block text-sm font-medium text-[#1B4D1E]">
              Cliente registrado (opcional)
            </label>
            <select
              id="cliente_id"
              value={cliente_id}
              onChange={(e) => onSelectCliente(e.target.value)}
              className={selectClassName}
            >
              <option value="">Otro (escribir manualmente)</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          id="empresa_cliente"
          label="Nombre de la empresa"
          placeholder="Ej: Alimentos S.A.S."
          value={empresa_cliente}
          onChange={(e) => onChange({ empresa_cliente: e.target.value })}
          error={errors.empresa_cliente}
          required
        />

        <Input
          id="nit_cliente"
          label="NIT (opcional)"
          placeholder="Ej: 900.123.456-7"
          value={nit_cliente}
          onChange={(e) => onChange({ nit_cliente: e.target.value })}
          error={errors.nit_cliente}
        />
      </div>
    </div>
  );
}
