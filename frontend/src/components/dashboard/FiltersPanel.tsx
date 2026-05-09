export type OrdersFilters = {
  fecha_inicio: string;
  fecha_fin: string;
  cliente_id: string;
  producto: string;
};

type FiltersPanelProps = {
  filters: OrdersFilters;
  onChange: (name: keyof OrdersFilters, value: string) => void;
  onReset: () => void;
};

export default function FiltersPanel({
  filters,
  onChange,
  onReset,
}: FiltersPanelProps) {
  return (
    <section className="rounded-2xl border border-[#E4ECE7] bg-white p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm text-[#2F473D]">
            Fecha inicio
            <input
              type="date"
              value={filters.fecha_inicio}
              onChange={(event) => onChange("fecha_inicio", event.target.value)}
              className="rounded-lg border border-[#D5E1DB] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-[#2F473D]">
            Fecha fin
            <input
              type="date"
              value={filters.fecha_fin}
              onChange={(event) => onChange("fecha_fin", event.target.value)}
              className="rounded-lg border border-[#D5E1DB] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-[#2F473D]">
            Cliente
            <input
              type="text"
              placeholder="ID del cliente"
              value={filters.cliente_id}
              onChange={(event) => onChange("cliente_id", event.target.value)}
              className="rounded-lg border border-[#D5E1DB] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-[#2F473D]">
            Producto
            <select
              value={filters.producto}
              onChange={(event) => onChange("producto", event.target.value)}
              className="rounded-lg border border-[#D5E1DB] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]"
            >
              <option value="">Todos</option>
              <option value="RBD">RBD</option>
              <option value="Oleina">Oleina</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onReset}
          aria-label="Limpiar filtros de pedidos"
          className="h-10 rounded-lg border border-[#C7D7CF] px-4 text-sm font-semibold text-[#2F473D] transition-colors hover:bg-[#F2F7F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]"
        >
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}
