"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { labelClass, selectClass } from "@/components/ui/formStyles";
import {
  connectionNodes,
  fetchAllNodes,
  graphqlRequest,
  PAGE_SIZE,
  type Connection,
  type PageInfo,
} from "@/lib/graphql";
import { getSession } from "@/lib/session";
import { getEmpresaActiva, setEmpresaActiva } from "@/lib/empresaActiva";
import { puede } from "@/lib/permisos";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { GET_ACTIVIDADES_QUERY, type ActividadEconomica } from "@/graphql/catalogos";
import {
  DELETE_CLIENTE_MUTATION,
  GET_CLIENTE_QUERY,
  GET_CLIENTES_QUERY,
  TIPOS_EMPRESA,
  formatNit,
  type Cliente,
  type TipoEmpresa,
} from "@/graphql/clientes";
import ClienteBuscador from "./ClienteBuscador";
import ClienteForm from "./ClienteForm";
import SedesPanel from "./SedesPanel";
import ContactosPanel from "./ContactosPanel";
import MovimientosLista from "@/components/dashboard/entregas/MovimientosLista";
import ExportarExcel from "@/components/dashboard/entregas/ExportarExcel";
import EnvasesCliente from "@/components/dashboard/inventario/EnvasesCliente";

type Vista = { tipo: "lista" } | { tipo: "nuevo" } | { tipo: "detalle"; cliente: Cliente };
type Pestana = "datos" | "sedes" | "contactos" | "historial" | "envases";

const TIPO_LABEL = Object.fromEntries(TIPOS_EMPRESA.map((t) => [t.value, t.label])) as Record<
  TipoEmpresa,
  string
>;

function Tipos({ tipos }: { tipos: TipoEmpresa[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {tipos.map((tipo) => (
        <span key={tipo} className="rounded-full bg-[#EEF3F0] px-2 py-0.5 text-[11px] font-semibold text-[#345247]">
          {TIPO_LABEL[tipo]}
        </span>
      ))}
    </span>
  );
}

function Incompleto() {
  return (
    <span className="rounded-full bg-[#FFF1EE] px-2 py-0.5 text-[11px] font-semibold text-[#C86010]">
      Datos incompletos
    </span>
  );
}

// Empresas cliente (IG-36): buscar y editar, crear con su primera sede,
// y administrar sus sedes (IG-37) y contactos (IG-38).
export default function ClientesModule() {
  const router = useRouter();
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const token = session?.token;
  const rol = session?.user.rol;
  const puedeLeer = puede(rol, "clientes", "leer");
  const puedeEditar = puede(rol, "clientes", "escribir");
  const puedeContactos = puede(rol, "contactos", "escribir");

  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [empresaId, setEmpresaId] = useState("");
  const [actividades, setActividades] = useState<ActividadEconomica[]>([]);
  const [tipo, setTipo] = useState<TipoEmpresa | "">("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ endCursor: null, hasNextPage: false });
  const [totalCount, setTotalCount] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });
  const [pestana, setPestana] = useState<Pestana>("datos");

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
    graphqlRequest<{ actividadesEconomicas: ActividadEconomica[] }>(GET_ACTIVIDADES_QUERY, {}, token)
      .then((data) => setActividades(data.actividadesEconomicas))
      .catch(() => setActividades([]));
  }, [token, puedeLeer]);

  const fetchClientes = useCallback(
    (after?: string) =>
      graphqlRequest<{ clientes: Connection<Cliente> }>(
        GET_CLIENTES_QUERY,
        { empresaId, tipo: tipo || undefined, first: PAGE_SIZE, after },
        token,
      )
        .then((data) => {
          const page = connectionNodes(data.clientes);
          setClientes((prev) => (after ? [...prev, ...page] : page));
          setPageInfo(data.clientes.pageInfo);
          setTotalCount(data.clientes.totalCount);
          setError("");
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Error al cargar clientes"),
        )
        .finally(() => setCargando(false)),
    [token, empresaId, tipo],
  );

  useEffect(() => {
    if (token && empresaId) void fetchClientes();
  }, [token, empresaId, fetchClientes]);

  const abrir = (cliente: Cliente, nuevaPestana: Pestana = "datos") => {
    setVista({ tipo: "detalle", cliente });
    setPestana(nuevaPestana);
  };

  // Reloads the open cliente after a change in its sedes or contactos
  const recargar = async (id: string) => {
    const data = await graphqlRequest<{ cliente: Cliente }>(GET_CLIENTE_QUERY, { id }, token);
    setVista({ tipo: "detalle", cliente: data.cliente });
    void fetchClientes();
  };

  const eliminar = async (cliente: Cliente) => {
    if (!window.confirm(`¿Eliminar ${cliente.razon_social}? Sus registros se conservan.`)) return;
    try {
      await graphqlRequest(DELETE_CLIENTE_MUTATION, { id: cliente.id }, token);
      setVista({ tipo: "lista" });
      setCargando(true);
      void fetchClientes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el cliente");
    }
  };

  if (!session || !puedeLeer) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDE8E2] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">Administración</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">Clientes</h1>
        </div>
        {empresas && empresas.length > 1 && (
          <div className="space-y-1.5 md:w-72">
            <label htmlFor="empresa-activa" className={labelClass}>
              Empresa
            </label>
            <select
              id="empresa-activa"
              value={empresaId}
              onChange={(e) => {
                setEmpresaId(e.target.value);
                setEmpresaActiva(e.target.value);
                setVista({ tipo: "lista" });
                setCargando(true);
              }}
              className={selectClass}
            >
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razon_social}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {empresas?.length === 0 ? (
        <p className="rounded-lg border border-[#DDE8E2] bg-white p-6 text-sm text-[#6B7F75]">
          No estás asociado a ninguna empresa. Pide al Super Administrador que te asigne una.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-[#DDE8E2] bg-white p-4 md:grid-cols-[1fr_auto] md:items-end">
            <ClienteBuscador empresaId={empresaId} token={token} onSelect={(c) => abrir(c)} />
            {puedeEditar && (
              <Button className="md:w-auto md:px-6" onClick={() => setVista({ tipo: "nuevo" })}>
                + Crear empresa nueva
              </Button>
            )}
          </div>

          {vista.tipo === "nuevo" && (
            <section className="space-y-4 rounded-lg border border-[#DDE8E2] bg-white p-5">
              <h2 className="text-lg font-bold text-[#17251F]">Crear empresa nueva</h2>
              <ClienteForm
                empresaId={empresaId}
                actividades={actividades}
                token={token}
                puedeEditar={puedeEditar}
                onGuardado={(cliente) => {
                  abrir(cliente, "sedes");
                  void fetchClientes();
                }}
                onCancelar={() => setVista({ tipo: "lista" })}
              />
            </section>
          )}

          {vista.tipo === "detalle" && (
            <section className="space-y-4 rounded-lg border border-[#DDE8E2] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#17251F]">{vista.cliente.razon_social}</h2>
                  <p className="text-sm text-[#6B7F75]">
                    {vista.cliente.nit ? `NIT ${formatNit(vista.cliente.nit, vista.cliente.dv)}` : "NIT pendiente"}
                    {vista.cliente.ciudad ? ` · ${vista.cliente.ciudad.nombre}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Tipos tipos={vista.cliente.tipos} />
                    {vista.cliente.datos_incompletos && <Incompleto />}
                  </div>
                </div>
                <div className="flex gap-3 text-sm font-semibold">
                  {puedeEditar && (
                    <button type="button" className="text-[#D63A2F] hover:underline" onClick={() => void eliminar(vista.cliente)}>
                      Eliminar
                    </button>
                  )}
                  <button type="button" className="text-[#6B7F75] hover:underline" onClick={() => setVista({ tipo: "lista" })}>
                    Cerrar
                  </button>
                </div>
              </div>

              <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[#DDE8E2]">
                {(
                  [
                    ["datos", "Datos"],
                    ["sedes", `Sedes (${vista.cliente.sedes.length})`],
                    ["contactos", `Contactos (${vista.cliente.contactos.length})`],
                    ...(puede(rol, "movimientos", "leer") ? ([["historial", "Historial"]] as const) : []),
                    ...(puede(rol, "inventario", "leer") ? ([["envases", "Envases"]] as const) : []),
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

              {pestana === "datos" && (
                <ClienteForm
                  key={vista.cliente.id}
                  cliente={vista.cliente}
                  empresaId={empresaId}
                  actividades={actividades}
                  token={token}
                  puedeEditar={puedeEditar}
                  onGuardado={(cliente) => {
                    setVista({ tipo: "detalle", cliente });
                    void fetchClientes();
                  }}
                />
              )}
              {pestana === "sedes" && (
                <SedesPanel
                  cliente={vista.cliente}
                  actividades={actividades}
                  token={token}
                  puedeEditar={puedeEditar}
                  onCambio={() => void recargar(vista.cliente.id)}
                />
              )}
              {pestana === "historial" && (
                <div className="space-y-3">
                  {puede(rol, "informes", "exportar") && (
                    <ExportarExcel filtros={{ clienteId: vista.cliente.id }} token={token} />
                  )}
                  <MovimientosLista filtros={{ clienteId: vista.cliente.id }} token={token} rol={rol} />
                </div>
              )}
              {pestana === "envases" && <EnvasesCliente clienteId={vista.cliente.id} token={token} />}
              {pestana === "contactos" && (
                <ContactosPanel
                  cliente={vista.cliente}
                  token={token}
                  puedeEditar={puedeContactos}
                  onCambio={() => void recargar(vista.cliente.id)}
                />
              )}
            </section>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#6B7F75]">{totalCount} clientes</p>
              <div className="w-56">
                <select
                  aria-label="Filtrar por tipo"
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value as TipoEmpresa | "");
                    setCargando(true);
                  }}
                  className={selectClass}
                >
                  <option value="">Todos los tipos</option>
                  {TIPOS_EMPRESA.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <FormError message={error} />
            {cargando ? (
              <p className="py-8 text-center text-sm text-[#6B7F75]">Cargando clientes...</p>
            ) : clientes.length === 0 ? (
              <p className="rounded-lg border border-[#DDE8E2] bg-white py-8 text-center text-sm text-[#6B7F75]">
                No hay clientes registrados.
              </p>
            ) : (
              <ul className="divide-y divide-[#EEF3F0] rounded-lg border border-[#DDE8E2] bg-white">
                {clientes.map((cliente) => (
                  <li key={cliente.id}>
                    <button
                      type="button"
                      onClick={() => abrir(cliente)}
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-[#F8FBF9] md:flex-row md:items-center md:justify-between"
                    >
                      <span>
                        <span className="block font-semibold text-[#17251F]">{cliente.razon_social}</span>
                        <span className="block text-xs text-[#6B7F75]">
                          {cliente.nit ? `NIT ${formatNit(cliente.nit, cliente.dv)}` : "NIT pendiente"}
                          {cliente.ciudad ? ` · ${cliente.ciudad.nombre}` : ""} · {cliente.sedes.length} sede
                          {cliente.sedes.length === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <Tipos tipos={cliente.tipos} />
                        {cliente.datos_incompletos && <Incompleto />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {pageInfo.hasNextPage && !cargando && (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  className="w-auto px-8"
                  onClick={() => void fetchClientes(pageInfo.endCursor ?? undefined)}
                >
                  Cargar más ({clientes.length} de {totalCount})
                </Button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
