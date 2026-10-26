"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";

type Item = { id: string; nombre: string };

type Props = {
  items: Item[];
  editable: boolean;
  placeholder: string;
  onCrear: (nombre: string) => Promise<unknown>;
  onRenombrar: (id: string, nombre: string) => Promise<unknown>;
  onEliminar: (id: string) => Promise<unknown>;
};

// Simple catalog of names (actividades económicas): add, rename, delete.
export default function ListaNombres({
  items,
  editable,
  placeholder,
  onCrear,
  onRenombrar,
  onEliminar,
}: Props) {
  const [nuevo, setNuevo] = useState("");
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);
  const [error, setError] = useState("");

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setError("");
    try {
      await accion();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {editable && (
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (nuevo.trim() && (await ejecutar(() => onCrear(nuevo)))) setNuevo("");
          }}
        >
          <input
            aria-label="Nuevo nombre"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-[#CFE0D2] px-3 py-2.5 text-sm"
          />
          <Button type="submit" className="sm:w-auto sm:px-6" disabled={!nuevo.trim()}>
            Agregar
          </Button>
        </form>
      )}
      <FormError message={error} />
      <ul className="divide-y divide-[#EEF3F0] rounded-lg border border-[#DDE8E2] bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            {editando?.id === item.id ? (
              <input
                aria-label={`Nombre de ${item.nombre}`}
                autoFocus
                value={editando.nombre}
                onChange={(e) => setEditando({ id: item.id, nombre: e.target.value })}
                className="flex-1 rounded-md border border-[#CFE0D2] px-2 py-1 text-sm"
              />
            ) : (
              <span className="text-sm text-[#17251F]">{item.nombre}</span>
            )}
            {editable && (
              <span className="flex gap-3 text-xs font-semibold">
                {editando?.id === item.id ? (
                  <>
                    <button
                      type="button"
                      className="text-[#0F6E2E] hover:underline"
                      onClick={async () => {
                        if (await ejecutar(() => onRenombrar(item.id, editando.nombre))) setEditando(null);
                      }}
                    >
                      Guardar
                    </button>
                    <button type="button" className="text-[#6B7F75] hover:underline" onClick={() => setEditando(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="text-[#0F6E2E] hover:underline" onClick={() => setEditando(item)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-[#D63A2F] hover:underline"
                      onClick={() => void ejecutar(() => onEliminar(item.id))}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
