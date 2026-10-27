"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { selectClass } from "@/components/ui/formStyles";
import { fetchAllNodes, graphqlRequest } from "@/lib/graphql";
import { getSession } from "@/lib/session";
import { puede } from "@/lib/permisos";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { GET_PRODUCTOS_QUERY, type ProductoCatalogo } from "@/graphql/catalogos";
import { TIPOS_MOVIMIENTO, type TipoMovimiento } from "@/graphql/movimientos";
import MovimientosLista, { type FiltrosMovimientos } from "./MovimientosLista";
import ExportarExcel from "./ExportarExcel";
import TextosCertificador from "./TextosCertificador";

const VACIOS: FiltrosMovimientos = { empresaId: "", tipo: "", productoId: "", fechaDesde: "", fechaHasta: "" };

// Entregas y recolecciones: history with filters (IG-32), Excel (IG-33)
export default function EntregasModule() {
  const router = useRouter();
  const [session] = useState(() => (typeof window === "undefined" ? null : getSession()));
  const token = session?.token;
  const rol = session?.user.rol;
  const puedeLeer = puede(rol, "movimientos", "leer");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [filtros, setFiltros] = useState<FiltrosMovimientos>(VACIOS);
  const [aplicados, setAplicados] = useState<FiltrosMovimientos>(VACIOS);

  useEffect(() => {
    if (session && !puedeLeer) router.replace("/dashboard");
  }, [session, puedeLeer, router]);

  useEffect(() => {
    if (!token || !puedeLeer) return;
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token).then(setEmpresas).catch(() => setEmpresas([]));
    graphqlRequest<{ productos: ProductoCatalogo[] }>(GET_PRODUCTOS_QUERY, {}, token)
      .then((d) => setProductos(d.productos))
      .catch(() => setProductos([]));
  }, [token, puedeLeer]);

  if (!session || !puedeLeer) return null;

  const set = (cambios: Partial<FiltrosMovimientos>) => setFiltros((prev) => ({ ...prev, ...cambios }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDE8E2] pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">Operaciones</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">Entregas</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {puede(rol, "informes", "exportar") && <ExportarExcel filtros={aplicados} token={token} />}
          {puede(rol, "movimientos", "crear") && (
            <Link
              href="/dashboard/entregas/nueva"
              className="inline-flex items-center justify-center rounded-lg bg-[#1A8A3A] px-6 py-2.5 font-semibold text-white hover:bg-[#0F6E2E]"
            >
              + Entrega / recolección
            </Link>
          )}
        </div>
      </div>

      {puede(rol, "movimientos", "configurarTextos") && <TextosCertificador token={token} />}

      <form
        className="grid grid-cols-1 gap-3 rounded-lg border border-[#DDE8E2] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          setAplicados(filtros);
        }}
      >
        {empresas.length > 1 && (
          <select aria-label="Empresa" value={filtros.empresaId} onChange={(e) => set({ empresaId: e.target.value })} className={selectClass}>
            <option value="">Todas las empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.razon_social}</option>
            ))}
          </select>
        )}
        <select
          aria-label="Tipo"
          value={filtros.tipo}
          onChange={(e) => set({ tipo: e.target.value as TipoMovimiento | "" })}
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_MOVIMIENTO.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select aria-label="Producto" value={filtros.productoId} onChange={(e) => set({ productoId: e.target.value })} className={selectClass}>
          <option value="">Todos los productos</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <input type="date" aria-label="Desde" title="Desde" value={filtros.fechaDesde} onChange={(e) => set({ fechaDesde: e.target.value })} className={selectClass} />
        <input type="date" aria-label="Hasta" title="Hasta" value={filtros.fechaHasta} onChange={(e) => set({ fechaHasta: e.target.value })} className={selectClass} />
        <div className="flex gap-3 sm:col-span-2 lg:col-span-5 lg:justify-end">
          <Button type="button" variant="secondary" className="lg:w-auto lg:px-6" onClick={() => { setFiltros(VACIOS); setAplicados(VACIOS); }}>
            Limpiar
          </Button>
          <Button type="submit" className="lg:w-auto lg:px-6">Filtrar</Button>
        </div>
      </form>

      <MovimientosLista key={JSON.stringify(aplicados)} filtros={aplicados} token={token} rol={rol} />
    </div>
  );
}
