"use client";

import type { Cliente } from "@/graphql/clientes";

type ClientesCardsProps = {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  isLoading?: boolean;
};

export default function ClientesCards({
  clientes,
  onEdit,
  onDelete,
  isLoading = false,
}: ClientesCardsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0F6E2E] border-t-transparent" />
          <span className="text-sm font-medium text-[#6B7F75]">Cargando clientes...</span>
        </div>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[#DDE8E2] bg-white py-12 px-4 md:hidden">
        <p className="text-sm font-medium text-[#6B7F75]">No hay clientes registrados</p>
        <p className="mt-1 text-xs text-[#83948D]">Crea tu primer cliente para comenzar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {clientes.map((cliente) => (
        <div
          key={cliente.id}
          className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm"
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
                  Cliente
                </p>
                <p className="truncate text-sm font-bold text-[#17251F]">
                  {cliente.nombre}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(cliente)}
                  title="Editar"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-[#0F6E2E] transition-colors hover:bg-[#E7F0E9]"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cliente)}
                  title="Eliminar"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-[#D63A2F] transition-colors hover:bg-[#FEE9E6]"
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Contacto */}
            <div className="border-t border-[#EEF3F0] pt-3">
              <p className="text-xs font-medium text-[#7D8E86]">Contacto</p>
              <p className="text-sm text-[#17251F]">{cliente.contacto}</p>
            </div>

            {/* Teléfono */}
            <div>
              <p className="text-xs font-medium text-[#7D8E86]">Teléfono</p>
              <p className="text-sm text-[#17251F]">{cliente.telefono}</p>
            </div>

            {/* Correo */}
            <div>
              <p className="text-xs font-medium text-[#7D8E86]">Correo</p>
              <p className="truncate text-sm text-[#17251F]">{cliente.correo}</p>
            </div>

            {/* Empresa */}
            <div>
              <p className="text-xs font-medium text-[#7D8E86]">Empresa</p>
              <p className="text-sm text-[#17251F]">{cliente.empresa_id}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
