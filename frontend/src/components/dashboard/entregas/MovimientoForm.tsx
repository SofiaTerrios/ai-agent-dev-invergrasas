"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import { labelClass, selectClass } from "@/components/ui/formStyles";
import { connectionNodes, fetchAllNodes, graphqlRequest, type Connection } from "@/lib/graphql";
import { downloadAuthenticatedFile } from "@/lib/api";
import { getSession } from "@/lib/session";
import { getEmpresaActiva, setEmpresaActiva } from "@/lib/empresaActiva";
import { puede } from "@/lib/permisos";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import {
  GET_CLIENTE_QUERY,
  GET_CLIENTES_QUERY,
  formatNit,
  type Cliente,
  type Contacto,
} from "@/graphql/clientes";
import {
  GET_EMPAQUES_QUERY,
  GET_PRODUCTOS_QUERY,
  GET_VEHICULOS_QUERY,
  type ProductoCatalogo,
  type TipoEmpaqueCatalogo,
  type Vehiculo,
} from "@/graphql/catalogos";
import {
  CREATE_MOVIMIENTO_MUTATION,
  GET_CONDUCTORES_QUERY,
  GET_SALDOS_QUERY,
  TIPOS_MOVIMIENTO,
  UNIDADES_MEDIDA,
  entrega,
  hoyEnBogota,
  recoleccion,
  type Conductor,
  type Movimiento,
  type SaldoEnvase,
  type TipoMovimiento,
} from "@/graphql/movimientos";
import ClienteBuscador from "@/components/dashboard/clientes/ClienteBuscador";
import ContactoFormModal from "@/components/dashboard/clientes/ContactoFormModal";

type Linea = {
  key: number;
  producto_id: string;
  unidad_medida: string;
  cantidad: string;
  tipo_empaque_id: string;
  cantidad_envases: string;
  vacios_recibidos: string;
  vacios_entregados: string;
};

type SedeDatos = {
  actividad: string;
  direccion: string;
  telefono: string;
  barrio: string;
  localidad: string;
  email: string;
};

const NIT_INVERGRASAS = "901684306";

let siguienteKey = 1;
const lineaVacia = (): Linea => ({
  key: siguienteKey++,
  producto_id: "",
  unidad_medida: "kg",
  cantidad: "",
  tipo_empaque_id: "",
  cantidad_envases: "",
  vacios_recibidos: "",
  vacios_entregados: "",
});

const entero = (valor: string) => (valor.trim() ? Number(valor) : 0);

// Invergrasas by default; otherwise the first of the list
const porDefecto = (lista: Cliente[]) =>
  (lista.find((c) => c.nit === NIT_INVERGRASAS) ?? lista[0])?.id ?? "";

const cuadro = "space-y-4 rounded-lg border border-[#DDE8E2] bg-white p-5";
const titulo = "text-sm font-bold uppercase tracking-[0.14em] text-[#0F6E2E]";

// Certificado de entrega y/o recolección (IG-39)
export default function MovimientoForm() {
  const router = useRouter();
  const [session] = useState(() => (typeof window === "undefined" ? null : getSession()));
  const token = session?.token;
  const rol = session?.user.rol;
  const puedeCrear = puede(rol, "movimientos", "crear");
  const eligeConductor = puede(rol, "movimientos", "elegirConductor");

  // Catalogs
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [empaques, setEmpaques] = useState<TipoEmpaqueCatalogo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [transportadores, setTransportadores] = useState<Cliente[]>([]);
  const [destinos, setDestinos] = useState<Cliente[]>([]);
  const [saldos, setSaldos] = useState<SaldoEnvase[]>([]);

  // Form
  const [empresaId, setEmpresaId] = useState("");
  const [fecha, setFecha] = useState(hoyEnBogota);
  const [tipo, setTipo] = useState<TipoMovimiento>("ENTREGA");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sedeId, setSedeId] = useState("");
  const [sedeDatos, setSedeDatos] = useState<SedeDatos | null>(null);
  const [contactoId, setContactoId] = useState("");
  const [lineas, setLineas] = useState<Linea[]>(() => [lineaVacia()]);
  const [conductorId, setConductorId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [transportadorId, setTransportadorId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [observacion, setObservacion] = useState("");
  const [creandoContacto, setCreandoContacto] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [emitido, setEmitido] = useState<Movimiento | null>(null);

  useEffect(() => {
    if (session && !puedeCrear) router.replace("/dashboard/entregas");
  }, [session, puedeCrear, router]);

  useEffect(() => {
    if (!token || !puedeCrear) return;
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token)
      .then((lista) => {
        setEmpresas(lista);
        const activa = getEmpresaActiva();
        setEmpresaId(lista.find((e) => e.id === activa)?.id ?? lista[0]?.id ?? "");
      })
      .catch(() => setEmpresas([]));
    graphqlRequest<{ productos: ProductoCatalogo[] }>(GET_PRODUCTOS_QUERY, {}, token)
      .then((d) => setProductos(d.productos))
      .catch(() => setProductos([]));
    graphqlRequest<{ tiposEmpaque: TipoEmpaqueCatalogo[] }>(GET_EMPAQUES_QUERY, {}, token)
      .then((d) => setEmpaques(d.tiposEmpaque))
      .catch(() => setEmpaques([]));
  }, [token, puedeCrear]);

  // Per empresa: conductores, vehicles, transportadores and destinos
  useEffect(() => {
    if (!token || !empresaId) return;
    graphqlRequest<{ conductores: Conductor[] }>(GET_CONDUCTORES_QUERY, { empresaId }, token)
      .then((d) => {
        setConductores(d.conductores);
        const propio = d.conductores.find((c) => c.id === session?.user.id) ?? d.conductores[0];
        setConductorId(propio?.id ?? "");
        setVehiculoId(propio?.vehiculo_por_defecto_id ?? "");
      })
      .catch(() => setConductores([]));
    graphqlRequest<{ vehiculos: Vehiculo[] }>(GET_VEHICULOS_QUERY, { empresaId }, token)
      .then((d) => setVehiculos(d.vehiculos))
      .catch(() => setVehiculos([]));
    for (const [tipoEmpresa, set, setId] of [
      ["TRANSPORTADOR", setTransportadores, setTransportadorId],
      ["DESTINO", setDestinos, setDestinoId],
    ] as const) {
      graphqlRequest<{ clientes: Connection<Cliente> }>(
        GET_CLIENTES_QUERY,
        { empresaId, tipo: tipoEmpresa, first: 100 },
        token,
      )
        .then((d) => {
          const lista = connectionNodes(d.clientes);
          set(lista);
          setId(porDefecto(lista));
        })
        .catch(() => set([]));
    }
  }, [token, empresaId, session?.user.id]);

  const cargarSaldos = useCallback(
    (clienteId: string) =>
      graphqlRequest<{ inventarioEnvases: SaldoEnvase[] }>(GET_SALDOS_QUERY, { clienteId }, token)
        .then((d) => setSaldos(d.inventarioEnvases))
        .catch(() => setSaldos([])),
    [token],
  );

  const elegirSede = (c: Cliente, id: string) => {
    const sede = c.sedes.find((s) => s.id === id);
    setSedeId(id);
    setSedeDatos(
      sede
        ? {
            actividad: sede.actividad_economica?.nombre ?? "",
            direccion: sede.direccion ?? "",
            telefono: sede.telefono ?? "",
            barrio: sede.barrio ?? "",
            localidad: sede.localidad ?? "",
            email: sede.email ?? "",
          }
        : null,
    );
    const contactos = ordenarContactos(c.contactos, id);
    setContactoId(contactos[0]?.id ?? "");
  };

  // Cliente → sede → contacto (IG-37, IG-38)
  const elegirCliente = async (resumen: Cliente) => {
    const { cliente: c } = await graphqlRequest<{ cliente: Cliente }>(GET_CLIENTE_QUERY, { id: resumen.id }, token);
    setCliente(c);
    elegirSede(c, (c.sedes.find((s) => s.principal) ?? c.sedes[0])?.id ?? "");
    void cargarSaldos(c.id);
  };

  const contactos = useMemo(() => ordenarContactos(cliente?.contactos ?? [], sedeId), [cliente, sedeId]);
  const contacto = contactos.find((c) => c.id === contactoId);
  const retornables = empaques.filter((e) => e.retornable);
  const vehiculosTransportador = vehiculos.filter((v) => !transportadorId || v.transportador_id === transportadorId);

  // Collecting more empty envases than the cliente has: allowed, with a warning (IG-27)
  const advertencias = useMemo(() => {
    if (!recoleccion(tipo) || !cliente) return [];
    const recogidos = new Map<string, number>();
    for (const l of lineas) {
      if (l.tipo_empaque_id) {
        recogidos.set(l.tipo_empaque_id, (recogidos.get(l.tipo_empaque_id) ?? 0) + entero(l.vacios_recibidos));
      }
    }
    return [...recogidos]
      .map(([id, cantidad]) => {
        const saldo = saldos.find((s) => s.tipo_empaque.id === id)?.saldo ?? 0;
        const nombre = empaques.find((e) => e.id === id)?.nombre ?? "envases";
        return cantidad > saldo
          ? `Según el inventario, ${cliente.razon_social} tiene ${saldo} ${nombre.toLowerCase()}(s); vas a recoger ${cantidad}.`
          : null;
      })
      .filter((a): a is string => a !== null);
  }, [tipo, cliente, lineas, saldos, empaques]);

  const cambiarLinea = (key: number, cambios: Partial<Linea>) =>
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...cambios } : l)));

  const cambiarTipo = (nuevo: TipoMovimiento) => {
    setTipo(nuevo);
    if (!entrega(nuevo)) {
      // A recolección has no product delivered
      setLineas((prev) =>
        prev.map((l) => ({ ...l, producto_id: "", cantidad: "", cantidad_envases: "", tipo_empaque_id: "" })),
      );
    }
  };

  const reiniciar = () => {
    setEmitido(null);
    setCliente(null);
    setSedeId("");
    setSedeDatos(null);
    setContactoId("");
    setLineas([lineaVacia()]);
    setObservacion("");
    setFecha(hoyEnBogota());
    setError("");
  };

  const emitir = async () => {
    if (!cliente || !sedeId) {
      setError("Elige el cliente y la sede.");
      return;
    }
    if (!conductorId) {
      setError("No hay conductor: el usuario de entrega debe estar asignado a la empresa.");
      return;
    }
    if (lineas.some((l) => !l.tipo_empaque_id)) {
      setError("Elige el tipo de envase de cada línea.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const data = await graphqlRequest<{ createMovimiento: Movimiento }>(
        CREATE_MOVIMIENTO_MUTATION,
        {
          input: {
            empresa_id: empresaId,
            tipo,
            fecha,
            cliente_id: cliente.id,
            sede_id: sedeId,
            contacto_id: contactoId || null,
            usuario_entrega_id: conductorId,
            vehiculo_id: vehiculoId || null,
            transportador_id: transportadorId || null,
            destino_id: destinoId || null,
            observacion: observacion.trim() || null,
            sede_datos: sedeDatos,
            lineas: lineas.map((l) => ({
              producto_id: entrega(tipo) && l.producto_id ? l.producto_id : null,
              unidad_medida: entrega(tipo) && l.producto_id ? l.unidad_medida : null,
              cantidad: entrega(tipo) && l.producto_id ? l.cantidad : null,
              tipo_empaque_id: l.tipo_empaque_id,
              cantidad_envases: entrega(tipo) ? entero(l.cantidad_envases) : 0,
              vacios_recibidos: entero(l.vacios_recibidos),
              vacios_entregados: entero(l.vacios_entregados),
            })),
          },
        },
        token,
      );
      setEmitido(data.createMovimiento);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo emitir el certificado.");
    } finally {
      setGuardando(false);
    }
  };

  if (!session || !puedeCrear) return null;

  if (emitido) {
    return (
      <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-[#DDE8E2] bg-white p-8 text-center">
        <h2 className="text-2xl font-black text-[#17251F]">Certificado N.º {emitido.numero_formateado} emitido</h2>
        <p className="text-sm text-[#6B7F75]">
          {emitido.snapshot.cliente.razon_social} · {emitido.snapshot.sede?.nombre}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            className="sm:w-auto sm:px-6"
            onClick={() =>
              token &&
              void downloadAuthenticatedFile(emitido.archivo_url, token, `certificado-${emitido.numero_formateado}.pdf`)
            }
          >
            Descargar PDF
          </Button>
          <Button variant="secondary" className="sm:w-auto sm:px-6" onClick={reiniciar}>
            Nuevo registro
          </Button>
        </div>
        <Link href="/dashboard/entregas" className="text-sm font-semibold text-[#0F6E2E] hover:underline">
          Ver historial
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="border-b border-[#DDE8E2] pb-6">
        <Link
          href="/dashboard/entregas"
          className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86] hover:text-[#0F6E2E]"
        >
          ← Entregas
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F]">Entrega / recolección</h1>
      </div>

      <section className={cuadro}>
        <h2 className={titulo}>Encabezado</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {empresas && empresas.length > 1 && (
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="mov-empresa" className={labelClass}>Empresa</label>
              <select
                id="mov-empresa"
                value={empresaId}
                onChange={(e) => {
                  setEmpresaId(e.target.value);
                  setEmpresaActiva(e.target.value);
                  reiniciar();
                }}
                className={selectClass}
              >
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.razon_social}</option>
                ))}
              </select>
            </div>
          )}
          <Input
            id="mov-fecha"
            type="date"
            label="Fecha"
            max={hoyEnBogota()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <fieldset className="space-y-1.5">
            <legend className={labelClass}>Tipo de certificado</legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {TIPOS_MOVIMIENTO.map((t) => (
                <label
                  key={t.value}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                    tipo === t.value
                      ? "border-[#0F6E2E] bg-[#E1F5EE] text-[#0F6E2E]"
                      : "border-[#CFE0D2] text-[#345247]"
                  }`}
                >
                  <input
                    type="radio"
                    name="mov-tipo"
                    value={t.value}
                    checked={tipo === t.value}
                    onChange={() => cambiarTipo(t.value)}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className={cuadro}>
        <h2 className={titulo}>Datos del cliente</h2>
        {cliente ? (
          <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-[#F8FBF9] p-3">
            <div>
              <p className="font-semibold text-[#17251F]">{cliente.razon_social}</p>
              <p className="text-xs text-[#6B7F75]">
                {cliente.nit ? `NIT ${formatNit(cliente.nit, cliente.dv)}` : "NIT pendiente"}
                {cliente.registro ? ` · Registro ${cliente.registro}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-[#0F6E2E] hover:underline"
              onClick={() => setCliente(null)}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <ClienteBuscador empresaId={empresaId} token={token} onSelect={(c) => void elegirCliente(c)} />
        )}

        {cliente && (
          <>
            <div className="space-y-1.5">
              <label htmlFor="mov-sede" className={labelClass}>Nombre local</label>
              <select
                id="mov-sede"
                value={sedeId}
                onChange={(e) => elegirSede(cliente, e.target.value)}
                className={selectClass}
              >
                {cliente.sedes.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            {sedeDatos && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(
                  [
                    ["actividad", "Actividad"],
                    ["direccion", "Dirección"],
                    ["telefono", "Teléfono"],
                    ["barrio", "Barrio"],
                    ["localidad", "Localidad"],
                    ["email", "Email"],
                  ] as const
                ).map(([campo, label]) => (
                  <Input
                    key={campo}
                    id={`mov-sede-${campo}`}
                    label={label}
                    value={sedeDatos[campo]}
                    onChange={(e) => setSedeDatos({ ...sedeDatos, [campo]: e.target.value })}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-[#83948D]">
              Los cambios a estos datos aplican solo a este certificado.
            </p>
          </>
        )}
      </section>

      <section className={cuadro}>
        <div className="flex items-center justify-between">
          <h2 className={titulo}>Detalle</h2>
          <Button variant="secondary" className="w-auto px-4" onClick={() => setLineas((p) => [...p, lineaVacia()])}>
            + Línea
          </Button>
        </div>
        {lineas.map((l, i) => {
          const producto = productos.find((p) => p.id === l.producto_id);
          const opcionesEnvase = entrega(tipo) && producto ? producto.empaques : retornables;
          return (
            <div key={l.key} className="space-y-3 rounded-lg border border-[#EEF3F0] p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#6B7F75]">Línea {i + 1}</p>
                {lineas.length > 1 && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#D63A2F] hover:underline"
                    onClick={() => setLineas((p) => p.filter((x) => x.key !== l.key))}
                  >
                    Quitar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {entrega(tipo) && (
                  <>
                    <div className="col-span-2 space-y-1.5">
                      <label htmlFor={`l${l.key}-producto`} className={labelClass}>Producto</label>
                      <select
                        id={`l${l.key}-producto`}
                        value={l.producto_id}
                        onChange={(e) => cambiarLinea(l.key, { producto_id: e.target.value, tipo_empaque_id: "" })}
                        className={selectClass}
                      >
                        <option value="">{tipo === "ENTREGA" ? "Elige el producto" : "Solo recolección"}</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      id={`l${l.key}-cantidad`}
                      label="Cantidad"
                      inputMode="decimal"
                      placeholder="0,0"
                      disabled={!l.producto_id}
                      value={l.cantidad}
                      onChange={(e) => cambiarLinea(l.key, { cantidad: e.target.value })}
                    />
                    <div className="space-y-1.5">
                      <label htmlFor={`l${l.key}-unidad`} className={labelClass}>Unidad</label>
                      <select
                        id={`l${l.key}-unidad`}
                        value={l.unidad_medida}
                        disabled={!l.producto_id}
                        onChange={(e) => cambiarLinea(l.key, { unidad_medida: e.target.value })}
                        className={selectClass}
                      >
                        {UNIDADES_MEDIDA.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor={`l${l.key}-envase`} className={labelClass}>Tipo de envase</label>
                  <select
                    id={`l${l.key}-envase`}
                    value={l.tipo_empaque_id}
                    onChange={(e) => cambiarLinea(l.key, { tipo_empaque_id: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Elige el envase</option>
                    {opcionesEnvase.map((e) => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                {entrega(tipo) && (
                  <Input
                    id={`l${l.key}-llenos`}
                    label="Envases llenos"
                    type="number"
                    min={0}
                    disabled={!l.producto_id}
                    value={l.cantidad_envases}
                    onChange={(e) => cambiarLinea(l.key, { cantidad_envases: e.target.value })}
                  />
                )}
                <Input
                  id={`l${l.key}-recibidos`}
                  label={tipo === "ENTREGA" ? "Vacíos recibidos (opc.)" : "Vacíos recibidos"}
                  type="number"
                  min={0}
                  value={l.vacios_recibidos}
                  onChange={(e) => cambiarLinea(l.key, { vacios_recibidos: e.target.value })}
                />
                <Input
                  id={`l${l.key}-entregados`}
                  label="Vacíos entregados"
                  type="number"
                  min={0}
                  value={l.vacios_entregados}
                  onChange={(e) => cambiarLinea(l.key, { vacios_entregados: e.target.value })}
                />
              </div>
            </div>
          );
        })}
        {advertencias.map((a) => (
          <p key={a} className="rounded-lg border border-[#F5D58A] bg-[#FFF8E6] p-3 text-sm text-[#8A5A00]">
            {a} Se puede emitir igual.
          </p>
        ))}

        {cliente && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <label htmlFor="mov-contacto" className={labelClass}>
                {tipo === "RECOLECCION" ? "Persona que entrega" : "Persona que recibe"}
              </label>
              <select
                id="mov-contacto"
                value={contactoId}
                onChange={(e) => setContactoId(e.target.value)}
                className={selectClass}
              >
                <option value="">Sin especificar</option>
                {contactos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                    {c.sede_id === sedeId ? " (esta sede)" : ""}
                  </option>
                ))}
              </select>
              {contacto?.cargo && <p className="text-xs text-[#6B7F75]">Cargo: {contacto.cargo}</p>}
            </div>
            <Button variant="secondary" className="sm:w-auto sm:px-4" onClick={() => setCreandoContacto(true)}>
              Crear contacto
            </Button>
          </div>
        )}
      </section>

      <section className={cuadro}>
        <h2 className={titulo}>Transportador</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              ["mov-transportador", "Transportador", transportadorId, setTransportadorId, transportadores],
              ["mov-destino", "Destino", destinoId, setDestinoId, destinos],
            ] as const
          ).map(([id, label, valor, set, lista]) => (
            <div key={id} className="space-y-1.5">
              <label htmlFor={id} className={labelClass}>{label}</label>
              <select id={id} value={valor} onChange={(e) => set(e.target.value)} className={selectClass}>
                <option value="">Sin especificar</option>
                {lista.map((c) => (
                  <option key={c.id} value={c.id}>{c.razon_social}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="space-y-1.5">
            <label htmlFor="mov-conductor" className={labelClass}>Conductor (firma)</label>
            <select
              id="mov-conductor"
              value={conductorId}
              disabled={!eligeConductor}
              onChange={(e) => {
                setConductorId(e.target.value);
                setVehiculoId(conductores.find((c) => c.id === e.target.value)?.vehiculo_por_defecto_id ?? "");
              }}
              className={selectClass}
            >
              {conductores.length === 0 && <option value="">Sin conductores en esta empresa</option>}
              {conductores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.tiene_firma ? "" : " (sin firma)"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="mov-vehiculo" className={labelClass}>Placa</label>
            <select id="mov-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className={selectClass}>
              <option value="">Sin vehículo</option>
              {vehiculosTransportador.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa}
                  {v.descripcion ? ` · ${v.descripcion}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={cuadro}>
        <label htmlFor="mov-observacion" className={titulo}>Observación</label>
        <textarea
          id="mov-observacion"
          rows={3}
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className="w-full rounded-lg border border-[#CFE0D2] px-3 py-2 text-sm"
        />
      </section>

      <FormError message={error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" className="sm:w-auto sm:px-6" onClick={reiniciar}>
          Nuevo registro
        </Button>
        <Button className="sm:w-auto sm:px-8" isLoading={guardando} onClick={() => void emitir()}>
          Generar PDF
        </Button>
      </div>

      {creandoContacto && cliente && (
        <ContactoFormModal
          clienteId={cliente.id}
          sedes={cliente.sedes}
          sedeId={sedeId}
          token={token}
          onClose={() => setCreandoContacto(false)}
          onGuardado={(nuevo: Contacto) => {
            setCliente({ ...cliente, contactos: [...cliente.contactos, nuevo] });
            setContactoId(nuevo.id);
            setCreandoContacto(false);
          }}
        />
      )}
    </div>
  );
}

// Contactos of the chosen sede first (IG-38)
function ordenarContactos(contactos: Contacto[], sedeId: string) {
  return [
    ...contactos.filter((c) => c.sede_id === sedeId),
    ...contactos.filter((c) => c.sede_id !== sedeId),
  ];
}
