"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  connectionNodes,
  fetchAllNodes,
  graphqlRequest,
  PAGE_SIZE,
  type Connection,
  type PageInfo,
} from "@/lib/graphql";
import { getSession } from "@/lib/session";
import { puede } from "@/lib/permisos";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import {
  GET_CERTIFICADOS_QUERY,
  GET_FIRMANTE_QUERY,
  TIPO_LABELS,
  formatFecha,
  type Certificado,
  type Firmante,
} from "@/graphql/certificados";
import CertificadoDetalleModal from "./CertificadoDetalleModal";
import FirmanteCard from "./FirmanteCard";

type Filtros = {
  empresaId: string;
  tipo: "" | Certificado["tipo"];
  busqueda: string;
  fechaDesde: string;
  fechaHasta: string;
};

const FILTROS_VACIOS: Filtros = {
  empresaId: "",
  tipo: "",
  busqueda: "",
  fechaDesde: "",
  fechaHasta: "",
};

const fieldClass =
  "w-full rounded-lg border border-[#CFE0D2] bg-white px-3 py-2 text-sm text-[#3A3A3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4A017]";
const th = "px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-[#7D8E86]";

// Empty filters are not sent
const variables = (filtros: Filtros) =>
  Object.fromEntries(Object.entries(filtros).filter(([, value]) => value !== ""));

function EstadoBadge({ certificado }: { certificado: Certificado }) {
  return certificado.anulado ? (
    <span className="rounded-full bg-[#FFF1EE] px-2 py-0.5 text-[11px] font-semibold text-[#C86010]">
      Anulado
    </span>
  ) : (
    <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#0F6E56]">
      Vigente
    </span>
  );
}

// Historial de certificados de análisis (IG-18)
export default function CertificadosHistorial() {
  const router = useRouter();
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const token = session?.token;
  const rol = session?.user.rol;
  const puedeLeer = puede(rol, "certificados", "leer");
  const puedeGenerar = puede(rol, "certificados", "escribir");

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  // Applied on submit, so typing does not query on every key
  const [aplicados, setAplicados] = useState<Filtros>(FILTROS_VACIOS);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ endCursor: null, hasNextPage: false });
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [firmante, setFirmante] = useState<Firmante | null | undefined>(undefined);

  useEffect(() => {
    if (session && !puedeLeer) router.replace("/dashboard");
  }, [session, puedeLeer, router]);

  useEffect(() => {
    if (!token || !puedeLeer) return;
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token)
      .then(setEmpresas)
      .catch(() => setEmpresas([]));
    graphqlRequest<{ firmanteCertificados: Firmante | null }>(GET_FIRMANTE_QUERY, {}, token)
      .then((data) => setFirmante(data.firmanteCertificados))
      .catch(() => setFirmante(null));
  }, [token, puedeLeer]);

  // Loads the first page, or appends the next one when `after` is given.
  const fetchCertificados = useCallback(
    (after?: string) =>
      graphqlRequest<{ certificados: Connection<Certificado> }>(
        GET_CERTIFICADOS_QUERY,
        { first: PAGE_SIZE, after, ...variables(aplicados) },
        token,
      )
        .then((data) => {
          const page = connectionNodes(data.certificados);
          setCertificados((prev) => (after ? [...prev, ...page] : page));
          setPageInfo(data.certificados.pageInfo);
          setTotalCount(data.certificados.totalCount);
          setError("");
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Error al cargar certificados"),
        )
        .finally(() => {
          setIsLoading(false);
          setIsLoadingMore(false);
        }),
    [token, aplicados],
  );

  useEffect(() => {
    if (token && puedeLeer) void fetchCertificados();
  }, [token, puedeLeer, fetchCertificados]);

  const setFiltro = <K extends keyof Filtros>(campo: K, valor: Filtros[K]) =>
    setFiltros((prev) => ({ ...prev, [campo]: valor }));

  const aplicar = (nuevos: Filtros) => {
    setIsLoading(true);
    setAplicados(nuevos);
  };

  if (!session || !puedeLeer) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDE8E2] pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">
            Operaciones
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">
            Certificados
          </h1>
        </div>
        {puedeGenerar && (
          <Link
            href="/dashboard/certificados/nuevo"
            className="inline-flex items-center justify-center rounded-lg bg-[#1A8A3A] px-6 py-2.5 font-semibold text-white transition hover:bg-[#0F6E2E]"
          >
            + Generar certificado
          </Link>
        )}
      </div>

      {(puedeGenerar || firmante === null) && (
        <FirmanteCard
          firmante={firmante}
          editable={puede(rol, "certificados", "configurarFirmante")}
          token={token}
          onChange={setFirmante}
        />
      )}

      <form
        className="grid grid-cols-1 gap-3 rounded-lg border border-[#DDE8E2] bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          aplicar(filtros);
        }}
      >
        <input
          aria-label="Buscar por cliente, NIT o lote"
          placeholder="Cliente, NIT o lote"
          value={filtros.busqueda}
          onChange={(e) => setFiltro("busqueda", e.target.value)}
          className={`${fieldClass} lg:col-span-2`}
        />
        <select
          aria-label="Empresa"
          value={filtros.empresaId}
          onChange={(e) => setFiltro("empresaId", e.target.value)}
          className={fieldClass}
        >
          <option value="">Todas las empresas</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.razon_social}
            </option>
          ))}
        </select>
        <select
          aria-label="Tipo"
          value={filtros.tipo}
          onChange={(e) => setFiltro("tipo", e.target.value as Filtros["tipo"])}
          className={fieldClass}
        >
          <option value="">Todos los tipos</option>
          <option value="oleina">Oleína</option>
          <option value="rbd">RBD</option>
        </select>
        <input
          type="date"
          aria-label="Emitidos desde"
          title="Emitidos desde"
          value={filtros.fechaDesde}
          onChange={(e) => setFiltro("fechaDesde", e.target.value)}
          className={fieldClass}
        />
        <input
          type="date"
          aria-label="Emitidos hasta"
          title="Emitidos hasta"
          value={filtros.fechaHasta}
          onChange={(e) => setFiltro("fechaHasta", e.target.value)}
          className={fieldClass}
        />
        <div className="flex gap-3 sm:col-span-2 lg:col-span-6 lg:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="lg:w-auto lg:px-6"
            onClick={() => {
              setFiltros(FILTROS_VACIOS);
              aplicar(FILTROS_VACIOS);
            }}
          >
            Limpiar
          </Button>
          <Button type="submit" className="lg:w-auto lg:px-6">
            Filtrar
          </Button>
        </div>
      </form>

      {error ? (
        <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF1EE] p-4">
          <p className="text-sm font-semibold text-[#C86010]">{error}</p>
        </div>
      ) : isLoading ? (
        <p className="py-12 text-center text-sm font-medium text-[#6B7F75]">
          Cargando certificados...
        </p>
      ) : certificados.length === 0 ? (
        <p className="rounded-lg border border-[#DDE8E2] bg-white py-12 text-center text-sm text-[#6B7F75]">
          No hay certificados para mostrar.
        </p>
      ) : (
        <>
          <p className="text-sm text-[#6B7F75]">{totalCount} certificados</p>
          <div className="hidden overflow-x-auto rounded-lg border border-[#DDE8E2] bg-white lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#DDE8E2] bg-[#F8FBF9]">
                  <th className={th}>Emisión</th>
                  <th className={th}>Tipo</th>
                  <th className={th}>Cliente</th>
                  <th className={th}>NIT</th>
                  <th className={th}>Lote</th>
                  <th className={th}>Vence</th>
                  <th className={th}>Empresa</th>
                  <th className={th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetalleId(c.id)}
                    className={`cursor-pointer border-b border-[#DDE8E2] last:border-0 hover:bg-[#F8FBF9] ${
                      c.anulado ? "text-[#8A9A93]" : "text-[#17251F]"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">{formatFecha(c.fecha_emision)}</td>
                    <td className="px-4 py-3 text-sm">{TIPO_LABELS[c.tipo]}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => setDetalleId(c.id)}
                      >
                        {c.empresa_cliente}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.nit_cliente ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">{c.lote}</td>
                    <td className="px-4 py-3 text-sm">{formatFecha(c.fecha_vencimiento, true)}</td>
                    <td className="px-4 py-3 text-sm">{c.empresa?.razon_social ?? "—"}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge certificado={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {certificados.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDetalleId(c.id)}
                className="block w-full space-y-1 rounded-lg border border-[#DDE8E2] bg-white p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-[#17251F]">
                    {c.empresa_cliente}
                  </p>
                  <EstadoBadge certificado={c} />
                </div>
                <p className="text-xs text-[#6B7F75]">
                  {TIPO_LABELS[c.tipo]} · Lote {c.lote} · {formatFecha(c.fecha_emision)}
                </p>
                <p className="text-xs text-[#83948D]">
                  Vence {formatFecha(c.fecha_vencimiento, true)}
                  {c.empresa ? ` · ${c.empresa.razon_social}` : ""}
                </p>
              </button>
            ))}
          </div>

          {pageInfo.hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                className="w-auto px-8"
                isLoading={isLoadingMore}
                onClick={() => {
                  setIsLoadingMore(true);
                  void fetchCertificados(pageInfo.endCursor ?? undefined);
                }}
              >
                Cargar más ({certificados.length} de {totalCount})
              </Button>
            </div>
          )}
        </>
      )}

      {detalleId && (
        <CertificadoDetalleModal
          key={detalleId}
          certificadoId={detalleId}
          token={token}
          puedeAnular={puede(rol, "certificados", "anular")}
          puedeGenerar={puedeGenerar}
          onClose={() => setDetalleId(null)}
          onAnulado={() => {
            setDetalleId(null);
            setIsLoading(true);
            void fetchCertificados();
          }}
        />
      )}
    </div>
  );
}
