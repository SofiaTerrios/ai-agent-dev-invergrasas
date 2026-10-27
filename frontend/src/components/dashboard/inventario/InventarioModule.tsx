"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import Modal from "@/components/ui/Modal";
import { labelClass, selectClass } from "@/components/ui/formStyles";
import { fetchAllNodes, graphqlRequest } from "@/lib/graphql";
import { getSession } from "@/lib/session";
import { getEmpresaActiva } from "@/lib/empresaActiva";
import { puede } from "@/lib/permisos";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { GET_EMPAQUES_QUERY, type TipoEmpaqueCatalogo } from "@/graphql/catalogos";
import type { Cliente } from "@/graphql/clientes";
import { AJUSTAR_INVENTARIO_MUTATION, GET_SALDOS_QUERY, type SaldoEnvase } from "@/graphql/movimientos";
import ClienteBuscador from "@/components/dashboard/clientes/ClienteBuscador";
import ExportarExcel from "@/components/dashboard/entregas/ExportarExcel";
import EnvasesCliente from "./EnvasesCliente";

// Returnable envases at the clientes (IG-31)
export default function InventarioModule() {
  const router = useRouter();
  const [session] = useState(() => (typeof window === "undefined" ? null : getSession()));
  const token = session?.token;
  const rol = session?.user.rol;
  const puedeLeer = puede(rol, "inventario", "leer");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [saldos, setSaldos] = useState<SaldoEnvase[] | null>(null);
  const [empaques, setEmpaques] = useState<TipoEmpaqueCatalogo[]>([]);
  const [detalle, setDetalle] = useState<{ id: string; razon_social: string } | null>(null);
  const [ajuste, setAjuste] = useState<{ cliente: Cliente | null; tipo_empaque_id: string; cantidad: string; motivo: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session && !puedeLeer) router.replace("/dashboard");
  }, [session, puedeLeer, router]);

  useEffect(() => {
    if (!token || !puedeLeer) return;
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token)
      .then((lista) => {
        setEmpresas(lista);
        const activa = getEmpresaActiva();
        setEmpresaId(lista.find((e) => e.id === activa)?.id ?? lista[0]?.id ?? "");
      })
      .catch(() => setEmpresas([]));
    graphqlRequest<{ tiposEmpaque: TipoEmpaqueCatalogo[] }>(GET_EMPAQUES_QUERY, {}, token)
      .then((d) => setEmpaques(d.tiposEmpaque.filter((e) => e.retornable)))
      .catch(() => setEmpaques([]));
  }, [token, puedeLeer]);

  const cargar = useCallback(() => {
    if (!token || !empresaId) return;
    graphqlRequest<{ inventarioEnvases: SaldoEnvase[] }>(GET_SALDOS_QUERY, { empresaId }, token)
      .then((d) => setSaldos(d.inventarioEnvases))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar"));
  }, [token, empresaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarAjuste = async () => {
    if (!ajuste?.cliente) return;
    setError("");
    try {
      await graphqlRequest(
        AJUSTAR_INVENTARIO_MUTATION,
        {
          input: {
            cliente_id: ajuste.cliente.id,
            tipo_empaque_id: ajuste.tipo_empaque_id,
            cantidad: Number(ajuste.cantidad),
            motivo: ajuste.motivo,
          },
        },
        token,
      );
      setAjuste(null);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el ajuste");
    }
  };

  if (!session || !puedeLeer) return null;

  // Totals per envase type across clientes
  const totales = new Map<string, number>();
  for (const s of saldos ?? []) totales.set(s.tipo_empaque.nombre, (totales.get(s.tipo_empaque.nombre) ?? 0) + s.saldo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDE8E2] pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">Operaciones</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">Inventario de envases</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {puede(rol, "informes", "exportar") && <ExportarExcel filtros={{ empresaId }} token={token} />}
          {puede(rol, "inventario", "ajustar") && (
            <Button
              className="w-auto px-6"
              onClick={() => setAjuste({ cliente: null, tipo_empaque_id: empaques[0]?.id ?? "", cantidad: "", motivo: "Saldo inicial" })}
            >
              Ajustar saldo
            </Button>
          )}
        </div>
      </div>

      {empresas.length > 1 && (
        <div className="w-72">
          <select aria-label="Empresa" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className={selectClass}>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.razon_social}</option>
            ))}
          </select>
        </div>
      )}

      <FormError message={ajuste ? "" : error} />

      <div className="flex flex-wrap gap-3">
        {[...totales].map(([nombre, total]) => (
          <div key={nombre} className="min-w-40 rounded-lg border border-[#DDE8E2] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7D8E86]">{nombre} en clientes</p>
            <p className="mt-2 text-3xl font-black text-[#17251F]">{total}</p>
          </div>
        ))}
      </div>

      {saldos === null ? (
        <p className="text-sm text-[#6B7F75]">Cargando...</p>
      ) : saldos.length === 0 ? (
        <p className="rounded-lg border border-[#DDE8E2] bg-white py-8 text-center text-sm text-[#6B7F75]">
          No hay envases retornables en los clientes.
        </p>
      ) : (
        <ul className="divide-y divide-[#EEF3F0] rounded-lg border border-[#DDE8E2] bg-white">
          {saldos.map((s) => (
            <li key={`${s.cliente.id}-${s.tipo_empaque.id}`}>
              <button
                type="button"
                onClick={() => setDetalle(s.cliente)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#F8FBF9]"
              >
                <span className="font-semibold text-[#17251F]">{s.cliente.razon_social}</span>
                <span className={`text-sm font-bold ${s.saldo < 0 ? "text-[#C86010]" : "text-[#17251F]"}`}>
                  {s.saldo} {s.tipo_empaque.nombre.toLowerCase()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {detalle && (
        <Modal titulo={`Envases de ${detalle.razon_social}`} onClose={() => setDetalle(null)}>
          <EnvasesCliente clienteId={detalle.id} token={token} />
        </Modal>
      )}

      {ajuste && (
        <Modal titulo="Ajustar saldo de envases" onClose={() => setAjuste(null)}>
          <div className="space-y-4">
            {ajuste.cliente ? (
              <p className="text-sm">
                Cliente: <strong>{ajuste.cliente.razon_social}</strong>{" "}
                <button type="button" className="text-[#0F6E2E] hover:underline" onClick={() => setAjuste({ ...ajuste, cliente: null })}>
                  Cambiar
                </button>
              </p>
            ) : (
              <ClienteBuscador empresaId={empresaId} token={token} onSelect={(c) => setAjuste({ ...ajuste, cliente: c })} />
            )}
            <div className="space-y-1.5">
              <label htmlFor="ajuste-envase" className={labelClass}>Envase</label>
              <select id="ajuste-envase" value={ajuste.tipo_empaque_id} onChange={(e) => setAjuste({ ...ajuste, tipo_empaque_id: e.target.value })} className={selectClass}>
                {empaques.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <Input
              id="ajuste-cantidad"
              type="number"
              label="Cantidad (negativa para corregir a la baja)"
              value={ajuste.cantidad}
              onChange={(e) => setAjuste({ ...ajuste, cantidad: e.target.value })}
            />
            <Input id="ajuste-motivo" label="Motivo" value={ajuste.motivo} onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })} />
            <FormError message={error} />
            <div className="flex gap-3">
              <Button variant="secondary" className="w-auto px-6" onClick={() => setAjuste(null)}>Cancelar</Button>
              <Button
                className="w-auto px-6"
                disabled={!ajuste.cliente || !ajuste.cantidad || Number(ajuste.cantidad) === 0}
                onClick={() => void guardarAjuste()}
              >
                Guardar ajuste
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
