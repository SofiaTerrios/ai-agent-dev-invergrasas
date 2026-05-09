"use client";

import { useEffect, useMemo, useState } from "react";
import FiltersPanel, { type OrdersFilters } from "./FiltersPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../ui/Table";
import { graphqlRequest } from "@/lib/graphql";
import { getSession } from "@/lib/session";

type OrderItem = {
  id: string;
  empresa_id: string;
  cliente_id: string;
  producto: "RBD" | "Oleina";
  tipo_empaque: "Granel" | "Caneca" | "Balde";
  cantidad_kg: number;
  fecha: string;
  cliente?: {
    nombre?: string;
  };
};

const INITIAL_FILTERS: OrdersFilters = {
  fecha_inicio: "",
  fecha_fin: "",
  cliente_id: "",
  producto: "",
};

const MOCK_ORDERS: OrderItem[] = [
  {
    id: "pedido-101",
    empresa_id: "empresa-a",
    cliente_id: "cli-001",
    producto: "RBD",
    tipo_empaque: "Granel",
    cantidad_kg: 1200,
    fecha: "2026-05-03",
    cliente: { nombre: "Alimentos del Norte" },
  },
  {
    id: "pedido-102",
    empresa_id: "empresa-a",
    cliente_id: "cli-002",
    producto: "Oleina",
    tipo_empaque: "Caneca",
    cantidad_kg: 860,
    fecha: "2026-05-05",
    cliente: { nombre: "Frituras Andinas" },
  },
  {
    id: "pedido-103",
    empresa_id: "empresa-b",
    cliente_id: "cli-003",
    producto: "RBD",
    tipo_empaque: "Balde",
    cantidad_kg: 430,
    fecha: "2026-05-06",
    cliente: { nombre: "Snacks Capital" },
  },
];

const ORDERS_QUERY = `
  query Pedidos($filters: PedidoFiltersInput) {
    pedidos(filters: $filters) {
      id
      empresa_id
      cliente_id
      producto
      tipo_empaque
      cantidad_kg
      fecha
      cliente {
        nombre
      }
    }
  }
`;

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("es-CO");
}

function matchesFilters(order: OrderItem, filters: OrdersFilters) {
  if (filters.producto && order.producto !== filters.producto) return false;

  if (filters.cliente_id) {
    const normalizedFilter = filters.cliente_id.toLowerCase();
    const hasMatch =
      order.cliente_id.toLowerCase().includes(normalizedFilter) ||
      (order.cliente?.nombre ?? "").toLowerCase().includes(normalizedFilter);
    if (!hasMatch) return false;
  }

  if (filters.fecha_inicio && new Date(order.fecha) < new Date(filters.fecha_inicio)) {
    return false;
  }

  if (filters.fecha_fin) {
    const endOfDay = new Date(filters.fecha_fin);
    endOfDay.setHours(23, 59, 59, 999);
    if (new Date(order.fecha) > endOfDay) return false;
  }

  return true;
}

export default function OrdersTable() {
  const [filters, setFilters] = useState<OrdersFilters>(INITIAL_FILTERS);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      try {
        const token = getSession()?.token;
        const data = await graphqlRequest<{ pedidos: OrderItem[] }>(
          ORDERS_QUERY,
          {
            filters: {
              ...(filters.fecha_inicio ? { fecha_inicio: filters.fecha_inicio } : {}),
              ...(filters.fecha_fin ? { fecha_fin: filters.fecha_fin } : {}),
              ...(filters.cliente_id ? { cliente_id: filters.cliente_id } : {}),
              ...(filters.producto ? { producto: filters.producto } : {}),
            },
          },
          token,
        );

        if (!cancelled) {
          setOrders(data.pedidos);
          setSource("api");
        }
      } catch {
        if (!cancelled) {
          setOrders(MOCK_ORDERS);
          setSource("mock");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [filters.fecha_inicio, filters.fecha_fin, filters.cliente_id, filters.producto]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesFilters(order, filters)),
    [orders, filters],
  );

  return (
    <section className="space-y-4 border border-[#DDE8E2] bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#17251F]">
            Pedidos recientes
          </h2>
          <p className="mt-1 text-sm text-[#486358]">
            Estado de la operación diaria por cliente y producto.
          </p>
        </div>
        <span className="rounded-md bg-[#F2F7F4] px-3 py-1 text-xs font-semibold text-[#2F473D]">
          Fuente: {source === "api" ? "API" : "Mock"}
        </span>
      </div>

      <FiltersPanel
        filters={filters}
        onChange={(name, value) => {
          setFilters((current) => ({ ...current, [name]: value }));
        }}
        onReset={() => {
          setFilters(INITIAL_FILTERS);
        }}
      />

      {loading ? (
        <div className="border border-dashed border-[#D5E1DB] p-6 text-sm text-[#486358]">
          Cargando pedidos...
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
                Cantidad (kg)
              </TableHeaderCell>
              <TableHeaderCell scope="col">Empresa</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#486358]">
                  No hay pedidos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatDate(order.fecha)}</TableCell>
                  <TableCell>{order.cliente?.nombre ?? order.cliente_id}</TableCell>
                  <TableCell>{order.producto}</TableCell>
                  <TableCell>{order.tipo_empaque}</TableCell>
                  <TableCell className="text-right">
                    {Number(order.cantidad_kg).toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell>{order.empresa_id}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
