"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OrdersTable from "./OrdersTable";
import Button from "@/components/ui/Button";
import { fetchAllNodes } from "@/lib/graphql";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { getSession } from "@/lib/session";
import { getEmpresaActiva, setEmpresaActiva } from "@/lib/empresaActiva";

type EmpresasState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; empresas: Empresa[] };

export default function PedidosModule() {
  const router = useRouter();
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const token = session?.token;
  const [reloadCount, setReloadCount] = useState(0);
  const [empresasState, setEmpresasState] = useState<EmpresasState>({ status: "loading" });
  const [selected, setSelected] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getEmpresaActiva(),
  );

  useEffect(() => {
    if (!session) router.replace("/login");
  }, [session, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token)
      .then((empresas) => {
        if (!cancelled) setEmpresasState({ status: "ready", empresas });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setEmpresasState({
          status: "error",
          message: error instanceof Error ? error.message : "Error al cargar empresas",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token, reloadCount]);

  const empresas = empresasState.status === "ready" ? empresasState.empresas : [];
  // Fall back to the first empresa when the remembered one is no longer available
  const empresaActiva =
    empresas.find((empresa) => empresa.id === selected) ?? empresas[0];

  const onSelectEmpresa = (empresaId: string) => {
    setSelected(empresaId);
    setEmpresaActiva(empresaId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDE8E2] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">
            Operaciones
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">
            <span className="text-[#0F6E2E]">Pedidos</span>
          </h1>
          <p className="mt-2 text-sm text-[#6B7F75]">
            Seguimiento de los pedidos y entregas despachados.
          </p>
        </div>

        {empresas.length > 0 && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#2F473D] md:min-w-72">
            Empresa
            <select
              value={empresaActiva?.id ?? ""}
              onChange={(event) => onSelectEmpresa(event.target.value)}
              className="rounded-lg border border-[#D5E1DB] bg-white px-3 py-2.5 text-sm text-[#17251F] outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]"
            >
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razon_social}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {empresasState.status === "loading" && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-[#D5E1DB] p-6 text-sm text-[#486358]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0F6E2E] border-t-transparent" />
          Cargando empresas...
        </div>
      )}

      {empresasState.status === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-[#DDE8E2] bg-white p-8 text-center">
          <p className="text-lg font-bold text-[#17251F]">Oops, algo salió mal</p>
          <p className="text-sm text-[#6B7F75]">{empresasState.message}</p>
          <Button
            onClick={() => {
              setEmpresasState({ status: "loading" });
              setReloadCount((n) => n + 1);
            }}
            className="w-auto px-8"
          >
            Reintentar
          </Button>
        </div>
      )}

      {empresasState.status === "ready" && !empresaActiva && (
        <div className="rounded-lg border border-[#DDE8E2] bg-white p-8 text-center">
          <p className="text-lg font-bold text-[#17251F]">No tienes empresas asignadas</p>
          <p className="mt-2 text-sm text-[#6B7F75]">
            Pide a un administrador que te asocie a una empresa para ver sus pedidos.
          </p>
        </div>
      )}

      {empresaActiva && (
        <OrdersTable
          empresaId={empresaActiva.id}
          title={`Pedidos de ${empresaActiva.razon_social}`}
          description="Filtra por cliente, producto o rango de fechas."
        />
      )}
    </div>
  );
}
