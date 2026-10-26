"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import Modal from "@/components/ui/Modal";
import { labelClass, selectClass } from "@/components/ui/formStyles";
import { graphqlRequest } from "@/lib/graphql";
import {
  CREATE_CONTACTO_MUTATION,
  UPDATE_CONTACTO_MUTATION,
  type Contacto,
  type Sede,
} from "@/graphql/clientes";

type Props = {
  clienteId: string;
  sedes: Sede[];
  // Edits this contacto; creates one when absent
  contacto?: Contacto;
  // Preselected sede for a new contacto (e.g. the one chosen in a form)
  sedeId?: string;
  token?: string | null;
  onClose: () => void;
  onGuardado: (contacto: Contacto) => void;
};

/**
 * Person of the cliente who receives or hands over (IG-38). Also the "Crear
 * contacto" quick create of the delivery form: it does not leave that form.
 */
export default function ContactoFormModal({
  clienteId,
  sedes,
  contacto,
  sedeId,
  token,
  onClose,
  onGuardado,
}: Props) {
  const [valores, setValores] = useState({
    nombre: contacto?.nombre ?? "",
    cargo: contacto?.cargo ?? "",
    documento: contacto?.documento ?? "",
    telefono: contacto?.telefono ?? "",
    email: contacto?.email ?? "",
    sede_id: contacto?.sede_id ?? sedeId ?? "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: keyof typeof valores, valor: string) =>
    setValores((prev) => ({ ...prev, [campo]: valor }));

  const guardar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valores.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (valores.email && !/^\S+@\S+\.\S+$/.test(valores.email)) {
      setError("El correo no es válido.");
      return;
    }
    setGuardando(true);
    setError("");
    const opcional = (valor: string) => valor.trim() || null;
    const datos = {
      nombre: valores.nombre.trim(),
      cargo: opcional(valores.cargo),
      documento: opcional(valores.documento),
      telefono: opcional(valores.telefono),
      email: opcional(valores.email),
      sede_id: valores.sede_id || null,
    };
    try {
      const guardado = contacto
        ? (
            await graphqlRequest<{ updateContacto: Contacto }>(
              UPDATE_CONTACTO_MUTATION,
              { id: contacto.id, input: datos },
              token,
            )
          ).updateContacto
        : (
            await graphqlRequest<{ createContacto: Contacto }>(
              CREATE_CONTACTO_MUTATION,
              { input: { ...datos, cliente_id: clienteId } },
              token,
            )
          ).createContacto;
      onGuardado(guardado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el contacto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={contacto ? "Editar contacto" : "Crear contacto"} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-4" noValidate>
        <Input
          id="contacto-nombre"
          label="Nombre completo"
          value={valores.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
        />
        <Input
          id="contacto-cargo"
          label="Cargo"
          placeholder="Ej.: Jefe de Producción"
          value={valores.cargo}
          onChange={(e) => cambiar("cargo", e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="contacto-documento"
            label="Documento (opcional)"
            value={valores.documento}
            onChange={(e) => cambiar("documento", e.target.value)}
          />
          <Input
            id="contacto-telefono"
            label="Teléfono"
            value={valores.telefono}
            onChange={(e) => cambiar("telefono", e.target.value)}
          />
        </div>
        <Input
          id="contacto-email"
          type="email"
          label="Correo"
          value={valores.email}
          onChange={(e) => cambiar("email", e.target.value)}
        />
        <div className="space-y-1.5">
          <label htmlFor="contacto-sede" className={labelClass}>
            Sede (opcional)
          </label>
          <select
            id="contacto-sede"
            value={valores.sede_id}
            onChange={(e) => cambiar("sede_id", e.target.value)}
            className={selectClass}
          >
            <option value="">Todas las sedes</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>
        <FormError message={error} />
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="w-auto px-6" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="w-auto px-6" isLoading={guardando}>
            {contacto ? "Guardar" : "Crear contacto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
