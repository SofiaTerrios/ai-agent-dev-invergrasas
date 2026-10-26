"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import { DELETE_CONTACTO_MUTATION, type Cliente, type Contacto } from "@/graphql/clientes";
import ContactoFormModal from "./ContactoFormModal";

type Props = {
  cliente: Cliente;
  token?: string | null;
  puedeEditar: boolean;
  onCambio: () => void;
};

// People of the cliente who receive or hand over (IG-38)
export default function ContactosPanel({ cliente, token, puedeEditar, onCambio }: Props) {
  // undefined: closed; null: new contacto
  const [editando, setEditando] = useState<Contacto | null | undefined>(undefined);
  const [error, setError] = useState("");
  const sedeNombre = (id: string | null) =>
    cliente.sedes.find((sede) => sede.id === id)?.nombre ?? "Todas las sedes";

  const desactivar = async (contacto: Contacto) => {
    setError("");
    try {
      await graphqlRequest(DELETE_CONTACTO_MUTATION, { id: contacto.id }, token);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el contacto.");
    }
  };

  return (
    <div className="space-y-4">
      {puedeEditar && (
        <div className="flex justify-end">
          <Button className="w-auto px-6" onClick={() => setEditando(null)}>
            + Crear contacto
          </Button>
        </div>
      )}
      <FormError message={error} />
      {cliente.contactos.length === 0 ? (
        <p className="rounded-lg border border-[#DDE8E2] bg-white py-8 text-center text-sm text-[#6B7F75]">
          Sin contactos registrados.
        </p>
      ) : (
        <ul className="space-y-3">
          {cliente.contactos.map((contacto) => (
            <li
              key={contacto.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-[#DDE8E2] bg-white p-4"
            >
              <div>
                <p className="font-semibold text-[#17251F]">{contacto.nombre}</p>
                <p className="text-sm text-[#6B7F75]">
                  {[contacto.cargo, sedeNombre(contacto.sede_id)].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-[#83948D]">
                  {[contacto.telefono, contacto.email, contacto.documento].filter(Boolean).join(" · ")}
                </p>
              </div>
              {puedeEditar && (
                <div className="flex gap-3 text-xs font-semibold">
                  <button type="button" className="text-[#0F6E2E] hover:underline" onClick={() => setEditando(contacto)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-[#D63A2F] hover:underline"
                    onClick={() => void desactivar(contacto)}
                  >
                    Desactivar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editando !== undefined && (
        <ContactoFormModal
          clienteId={cliente.id}
          sedes={cliente.sedes}
          contacto={editando ?? undefined}
          token={token}
          onClose={() => setEditando(undefined)}
          onGuardado={() => {
            setEditando(undefined);
            onCambio();
          }}
        />
      )}
    </div>
  );
}
