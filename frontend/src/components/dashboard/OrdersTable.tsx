"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FiltersPanel, { type OrdersFilters } from "./FiltersPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../ui/Table";
import Button from "../ui/Button";
import {
  connectionNodes,
  fetchAllNodes,
  graphqlRequest,
  PAGE_SIZE,
  type Connection,
  type PageInfo,
} from "@/lib/graphql";
import { GET_CLIENTES_BY_EMPRESA_QUERY, type Cliente } from "@/graphql/clientes";
import { getSession } from "@/lib/session";
import { PRODUCTO_LABELS, type Pedido } from "@/graphql/pedidos";

type OrderItem = Pedido;

type OrdersResult = {
  key: string;
  orders: OrderItem[];
  pageInfo: PageInfo;
  totalCount: number;
  error: string | null;
};

const INITIAL_FILTERS: OrdersFilters = {
  fecha_inicio: "",
  fecha_fin: "",
  cliente_id: "",
  producto: "",
};

const ORDERS_QUERY = `
  query Pedidos($filters: PedidoFiltersInput, $first: Int, $after: String) {
    pedidos(filters: $filters, first: $first, after: $after) {
      edges {
        node {
          id
          empresa_id
          cliente_id
          producto
          tipo_empaque
          cantidad_kg
          fecha
          cliente {
            razon_social
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  // Pedido dates are calendar days stored at UTC midnight
  return date.toLocaleDateString("es-CO", { timeZone: "UTC" });
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Error al cargar pedidos";

type OrdersTableProps = {
  // Only pedidos of this empresa; without it, every empresa the user can access
  empresaId?: string;
  title?: string;
  description?: string;
  // Changing it reloads the list (e.g. after creating or editing a pedido)
  reloadKey?: number;
  // Shows an "Editar" action per row
  onEdit?: (pedido: Pedido) => void;
};

export default function OrdersTable({
  empresaId,
  title = "Pedidos recientes",
  description = "Estado de la operación diaria por cliente y producto.",
  reloadKey = 0,
  onEdit,
}: OrdersTableProps) {
  const [filters, setFilters] = useState<OrdersFilters>(INITIAL_FILTERS);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<OrdersResult | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clientesState, setClientesState] = useState<{
    empresaId: string;
    list: Pick<Cliente, "id" | "razon_social">[];
  }>({ empresaId: "", list: [] });

  // A cliente filter only makes sense within the empresa it belongs to
  const [filtersEmpresaId, setFiltersEmpresaId] = useState(empresaId);
  if (filtersEmpresaId !== empresaId) {
    setFiltersEmpresaId(empresaId);
    setFilters((current) => ({ ...current, cliente_id: "" }));
  }

  const apiFilters = useMemo(
    () => ({
      ...(empresaId ? { empresa_id: empresaId } : {}),
      ...(filters.fecha_inicio ? { fecha_inicio: filters.fecha_inicio } : {}),
      ...(filters.fecha_fin ? { fecha_fin: filters.fecha_fin } : {}),
      ...(filters.cliente_id ? { cliente_id: filters.cliente_id } : {}),
      ...(filters.producto ? { producto: filters.producto } : {}),
    }),
    [empresaId, filters.fecha_inicio, filters.fecha_fin, filters.cliente_id, filters.producto],
  );
  const queryKey = JSON.stringify({ apiFilters, reloadCount, reloadKey });
  const loading = result?.key !== queryKey;
  const orders = loading ? [] : result.orders;

  const fetchOrders = useCallback(
    (after?: string | null) =>
      graphqlRequest<{ pedidos: Connection<OrderItem> }>(
        ORDERS_QUERY,
        { filters: apiFilters, first: PAGE_SIZE, after },
        getSession()?.token,
      ),
    [apiFilters],
  );

  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: queryKey,
          orders: connectionNodes(data.pedidos),
          pageInfo: data.pedidos.pageInfo,
          totalCount: data.pedidos.totalCount,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setResult({
          key: queryKey,
          orders: [],
          pageInfo: { endCursor: null, hasNextPage: false },
          totalCount: 0,
          error: errorMessage(error),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchOrders, queryKey]);

  useEffect(() => {
    if (!empresaId) return;
    fetchAllNodes<Cliente>(
      GET_CLIENTES_BY_EMPRESA_QUERY,
      "clientesByEmpresa",
      { empresaId },
      getSession()?.token,
    )
      .then((list) => setClientesState({ empresaId, list }))
      .catch((error: unknown) => console.error("Error loading clientes:", error));
  }, [empresaId]);

  const clientes = empresaId
    ? clientesState.empresaId === empresaId
      ? clientesState.list
      : []
    : undefined;

  const loadMore = () => {
    if (!result) return;
    setLoadingMore(true);
    fetchOrders(result.pageInfo.endCursor)
      .then((data) => {
        setResult((current) =>
          current && current.key === queryKey
            ? {
                ...current,
                orders: [...current.orders, ...connectionNodes(data.pedidos)],
                pageInfo: data.pedidos.pageInfo,
              }
            : current,
        );
      })
      .catch((error: unknown) => console.error("Error loading pedidos:", errorMessage(error)))
      .finally(() => setLoadingMore(false));
  };

  const error = loading ? null : result.error;

  return (
    <section className="space-y-4 border border-[#DDE8E2] bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#17251F]">{title}</h2>
          <p className="mt-1 text-sm text-[#486358]">{description}</p>
        </div>
        {!loading && !error && (
          <span className="rounded-md bg-[#F2F7F4] px-3 py-1 text-xs font-semibold text-[#2F473D]">
            {result.totalCount} {result.totalCount === 1 ? "pedido" : "pedidos"}
          </span>
        )}
      </div>

      <FiltersPanel
        filters={filters}
        clientes={clientes}
        onChange={(name, value) => {
          setFilters((current) => ({ ...current, [name]: value }));
        }}
        onReset={() => {
          setFilters(INITIAL_FILTERS);
        }}
      />

      {loading ? (
        <div className="flex items-center gap-3 border border-dashed border-[#D5E1DB] p-6 text-sm text-[#486358]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0F6E2E] border-t-transparent" />
          Cargando pedidos...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-[#DDE8E2] p-8 text-center">
          <p className="text-lg font-bold text-[#17251F]">Oops, algo salió mal</p>
          <p className="text-sm text-[#6B7F75]">{error}</p>
          <Button onClick={() => setReloadCount((n) => n + 1)} className="w-auto px-8">
            Reintentar
          </Button>
        </div>
      ) : (
        <Table aria-label="Tabla de pedidos">
          <TableHead>
            <TableRow>
              <TableHeaderCell scope="col">Fecha</TableHeaderCell>
              <TableHeaderCell scope="col">Cliente</TableHeaderCell>
              <TableHeaderCell scope="col">Producto</TableHeaderCell>
              <TableHeaderCell scope="col">Empaque</TableHeaderCell>
              <TableHeaderCell scope="col" className="text-right">
                Total (kg)
              </TableHeaderCell>
              {onEdit && (
                <TableHeaderCell scope="col" className="text-right">
                  Acciones
                </TableHeaderCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onEdit ? 6 : 5} className="text-center text-[#486358]">
                  No hay pedidos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatDate(order.fecha)}</TableCell>
                  <TableCell>{order.cliente?.razon_social ?? order.cliente_id}</TableCell>
                  <TableCell>{PRODUCTO_LABELS[order.producto] ?? order.producto}</TableCell>
                  <TableCell>{order.tipo_empaque}</TableCell>
                  <TableCell className="text-right">
                    {Number(order.cantidad_kg).toLocaleString("es-CO")}
                  </TableCell>
                  {onEdit && (
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => onEdit(order)}
                        aria-label={`Editar pedido del ${formatDate(order.fecha)} de ${order.cliente?.razon_social ?? "cliente"}`}
                        className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#0F6E2E] hover:bg-[#F2FAF4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]"
                      >
                        Editar
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {!loading && !error && result.pageInfo.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={loadMore}
            isLoading={loadingMore}
            className="w-auto px-8"
          >
            Cargar más pedidos ({orders.length} de {result.totalCount})
          </Button>
        </div>
      )}
    </section>
  );
}
