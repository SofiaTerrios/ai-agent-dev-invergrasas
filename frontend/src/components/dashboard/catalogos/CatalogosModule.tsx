"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAllNodes, graphqlRequest } from "@/lib/graphql";
import { getSession } from "@/lib/session";
import { puede } from "@/lib/permisos";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import {
  CREATE_ACTIVIDAD_MUTATION,
  DELETE_ACTIVIDAD_MUTATION,
  GET_ACTIVIDADES_QUERY,
  GET_EMPAQUES_QUERY,
  GET_PRODUCTOS_QUERY,
  UPDATE_ACTIVIDAD_MUTATION,
  type ActividadEconomica,
  type ProductoCatalogo,
  type TipoEmpaqueCatalogo,
} from "@/graphql/catalogos";
import ListaNombres from "./ListaNombres";
import ProductosPanel from "./ProductosPanel";
import VehiculosPanel from "./VehiculosPanel";

type Pestana = "productos" | "actividades" | "vehiculos";

// Catálogos (IG-35, IG-26) y vehículos (IG-40)
export default function CatalogosModule() {
  const router = useRouter();
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const token = session?.token;
  const rol = session?.user.rol;
  const editaProductos = puede(rol, "catalogos", "gestionarProductos");
  const editaActividades = puede(rol, "catalogos", "gestionarActividades");
  const editaVehiculos = puede(rol, "vehiculos", "escribir");
  const puedeEntrar = editaProductos || editaActividades || editaVehiculos;

  const [pestana, setPestana] = useState<Pestana>("productos");
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [empaques, setEmpaques] = useState<TipoEmpaqueCatalogo[]>([]);
  const [actividades, setActividades] = useState<ActividadEconomica[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);

  useEffect(() => {
    if (session && !puedeEntrar) router.replace("/dashboard");
  }, [session, puedeEntrar, router]);

  const cargar = useCallback(() => {
    if (!token) return;
    graphqlRequest<{ productos: ProductoCatalogo[] }>(GET_PRODUCTOS_QUERY, {}, token)
      .then((data) => setProductos(data.productos))
      .catch(() => setProductos([]));
    graphqlRequest<{ tiposEmpaque: TipoEmpaqueCatalogo[] }>(GET_EMPAQUES_QUERY, {}, token)
      .then((data) => setEmpaques(data.tiposEmpaque))
      .catch(() => setEmpaques([]));
    graphqlRequest<{ actividadesEconomicas: ActividadEconomica[] }>(GET_ACTIVIDADES_QUERY, {}, token)
      .then((data) => setActividades(data.actividadesEconomicas))
      .catch(() => setActividades([]));
  }, [token]);

  useEffect(() => {
    if (!token || !puedeEntrar) return;
    cargar();
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token)
      .then(setEmpresas)
      .catch(() => setEmpresas([]));
  }, [token, puedeEntrar, cargar]);

  if (!session || !puedeEntrar) return null;

  const accion = (query: string, variables: Record<string, unknown>) => async () => {
    await graphqlRequest(query, variables, token);
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#DDE8E2] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">Administración</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">Catálogos</h1>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[#DDE8E2]">
        {(
          [
            ["productos", "Productos y empaques"],
            ["actividades", "Actividades económicas"],
            ["vehiculos", "Vehículos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${
              pestana === id ? "border-[#0F6E2E] text-[#0F6E2E]" : "border-transparent text-[#6B7F75]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pestana === "productos" && (
        <ProductosPanel
          productos={productos}
          empaques={empaques}
          editable={editaProductos}
          token={token}
          onCambio={cargar}
        />
      )}
      {pestana === "actividades" && (
        <div className="space-y-3">
          {!editaActividades && (
            <p className="text-sm text-[#6B7F75]">Solo el Super Administrador edita este catálogo.</p>
          )}
          <ListaNombres
            items={actividades}
            editable={editaActividades}
            placeholder="Nueva actividad (ej.: Colegio)"
            onCrear={(nombre) => accion(CREATE_ACTIVIDAD_MUTATION, { nombre })()}
            onRenombrar={(id, nombre) => accion(UPDATE_ACTIVIDAD_MUTATION, { id, nombre })()}
            onEliminar={(id) => accion(DELETE_ACTIVIDAD_MUTATION, { id })()}
          />
        </div>
      )}
      {pestana === "vehiculos" &&
        (empresas === null ? (
          <p className="text-sm text-[#6B7F75]">Cargando...</p>
        ) : (
          <VehiculosPanel empresas={empresas} editable={editaVehiculos} token={token} />
        ))}
    </div>
  );
}
