"use client";

import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { UPDATE_CLIENTE_MUTATION, type Cliente, type UpdateClienteInput } from "@/graphql/clientes";

type EditClienteModalProps = {
  isOpen: boolean;
  cliente?: Cliente;
  onClose: () => void;
  onSuccess: () => void;
  token?: string | null;
};

type FormValues = UpdateClienteInput;

function validate(values: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (!values.nombre?.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  if (!values.contacto?.trim()) {
    errors.contacto = "El contacto es obligatorio.";
  }

  if (!values.telefono?.trim()) {
    errors.telefono = "El teléfono es obligatorio.";
  }

  if (!values.correo?.trim()) {
    errors.correo = "El correo es obligatorio.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.correo)) {
    errors.correo = "El correo debe ser válido.";
  }

  return errors;
}

export default function EditClienteModal({
  isOpen,
  cliente,
  onClose,
  onSuccess,
  token,
}: EditClienteModalProps) {
  const [values, setValues] = useState<FormValues>({
    nombre: "",
    contacto: "",
    telefono: "",
    correo: "",
    empresa_id: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  useEffect(() => {
    if (cliente && isOpen) {
      setValues({
        nombre: cliente.nombre,
        contacto: cliente.contacto,
        telefono: cliente.telefono,
        correo: cliente.correo,
        empresa_id: cliente.empresa_id,
      });
      setErrors({});
      setSubmitError("");
    }
  }, [cliente, isOpen]);

  // Load empresas on mount
  useEffect(() => {
    if (isOpen && token) {
      setLoadingEmpresas(true);
      graphqlRequest<{ empresas: Empresa[] }>(GET_EMPRESAS_QUERY, undefined, token)
        .then((data) => setEmpresas(data.empresas || []))
        .catch((err) => console.error("Error loading empresas:", err))
        .finally(() => setLoadingEmpresas(false));
    }
  }, [isOpen, token]);

  const onChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cliente) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setSubmitError("");

    try {
      const cleanValues = {
        ...(values.nombre && { nombre: values.nombre }),
        ...(values.contacto && { contacto: values.contacto }),
        ...(values.telefono && { telefono: values.telefono }),
        ...(values.correo && { correo: values.correo }),
        ...(values.empresa_id && { empresa_id: values.empresa_id }),
      };

      await graphqlRequest(
        UPDATE_CLIENTE_MUTATION,
        { id: cliente.id, input: cleanValues },
        token
      );
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al actualizar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !cliente) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#17251F]/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-[#DDE8E2] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="border-b border-[#DDE8E2] px-6 py-4 sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#17251F]">Editar Cliente</h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7F75] hover:bg-[#F1F6F3]"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={onSubmit} className="space-y-4 px-6 py-4">
            <Input
              id="nombre"
              label="Nombre"
              placeholder="Nombre del cliente"
              value={values.nombre || ""}
              onChange={(e) => onChange("nombre", e.target.value)}
              error={errors.nombre}
              disabled={isLoading}
            />

            <Input
              id="contacto"
              label="Contacto"
              placeholder="Nombre de la persona de contacto"
              value={values.contacto || ""}
              onChange={(e) => onChange("contacto", e.target.value)}
              error={errors.contacto}
              disabled={isLoading}
            />

            <Input
              id="telefono"
              label="Teléfono"
              placeholder="(1) 2345678"
              value={values.telefono || ""}
              onChange={(e) => onChange("telefono", e.target.value)}
              error={errors.telefono}
              disabled={isLoading}
            />

            <Input
              id="correo"
              label="Correo"
              type="email"
              placeholder="cliente@example.com"
              value={values.correo || ""}
              onChange={(e) => onChange("correo", e.target.value)}
              error={errors.correo}
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-semibold text-[#17251F] mb-2">
                Empresa
              </label>
              <select
                value={values.empresa_id || ""}
                onChange={(e) => onChange("empresa_id", e.target.value)}
                disabled={isLoading || loadingEmpresas}
                className="w-full rounded-lg border border-[#D5E1DB] bg-white px-4 py-2.5 text-sm text-[#17251F] placeholder-[#8A9A93] focus:border-[#0F6E2E] focus:outline-none focus:ring-2 focus:ring-[#0F6E2E]/20 disabled:bg-[#F8FBF9] disabled:text-[#8A9A93]"
              >
                <option value="">{loadingEmpresas ? "Cargando..." : "Selecciona empresa"}</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razon_social}
                  </option>
                ))}
              </select>
            </div>

            {submitError && <FormError message={submitError} />}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || loadingEmpresas}>
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
