"use client";

import type { Cliente } from "@/graphql/clientes";

type ClientesTableProps = {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  isLoading?: boolean;
};

export default function ClientesTable({
  clientes,
  onEdit,
  onDelete,
  isLoading = false,
}: ClientesTableProps) {
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
      <div className="flex flex-col items-center justify-center rounded-lg border border-[#DDE8E2] bg-white py-12 px-4">
        <p className="text-sm font-medium text-[#6B7F75]">No hay clientes registrados</p>
        <p className="mt-1 text-xs text-[#83948D]">Crea tu primer cliente para comenzar</p>
      </div>
    );
  }

  return (
    <div className="hidden overflow-x-auto rounded-lg border border-[#DDE8E2] md:block">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#DDE8E2] bg-[#F8FBF9]">
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Nombre
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Contacto
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Teléfono
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Correo
            </th>
            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Empresa
            </th>
            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente, idx) => (
            <tr
              key={cliente.id}
              className={`border-b border-[#DDE8E2] transition-colors hover:bg-[#F8FBF9] ${
                idx % 2 === 0 ? "bg-white" : "bg-[#FAFCFB]"
              }`}
            >
              <td className="px-6 py-4 text-sm font-semibold text-[#17251F]">
                {cliente.nombre}
              </td>
              <td className="px-6 py-4 text-sm text-[#6B7F75]">{cliente.contacto}</td>
              <td className="px-6 py-4 text-sm text-[#6B7F75]">{cliente.telefono}</td>
              <td className="px-6 py-4 text-sm text-[#6B7F75]">{cliente.correo}</td>
              <td className="px-6 py-4 text-sm text-[#6B7F75]">{cliente.empresa_id}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
