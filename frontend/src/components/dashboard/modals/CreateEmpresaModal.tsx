"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import { CREATE_EMPRESA_MUTATION, type CreateEmpresaInput } from "@/graphql/empresas";

type CreateEmpresaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token?: string | null;
};

type FormValues = CreateEmpresaInput;

function validate(values: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (!values.razon_social.trim()) {
    errors.razon_social = "La razón social es obligatoria.";
  }

  if (!values.nit.trim()) {
    errors.nit = "El NIT es obligatorio.";
  }

  return errors;
}

export default function CreateEmpresaModal({
  isOpen,
  onClose,
  onSuccess,
  token,
}: CreateEmpresaModalProps) {
  const [values, setValues] = useState<FormValues>({
    razon_social: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setSubmitError("");

    try {
      const cleanValues = {
        razon_social: values.razon_social,
        nit: values.nit,
        ...(values.direccion && { direccion: values.direccion }),
        ...(values.telefono && { telefono: values.telefono }),
        ...(values.correo && { correo: values.correo }),
      };

      await graphqlRequest(CREATE_EMPRESA_MUTATION, { input: cleanValues }, token);
      setValues({ razon_social: "", nit: "", direccion: "", telefono: "", correo: "" });
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error al crear empresa");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#17251F]/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-[#DDE8E2] bg-white shadow-lg">
          {/* Header */}
          <div className="border-b border-[#DDE8E2] px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#17251F]">Nueva Empresa</h2>
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
              id="razon_social"
              label="Razón Social"
              placeholder="Nombre de la empresa"
              value={values.razon_social}
              onChange={(e) => onChange("razon_social", e.target.value)}
              error={errors.razon_social}
              disabled={isLoading}
            />

            <Input
              id="nit"
              label="NIT"
              placeholder="123456789-X"
              value={values.nit}
              onChange={(e) => onChange("nit", e.target.value)}
              error={errors.nit}
              disabled={isLoading}
            />

            <Input
              id="direccion"
              label="Dirección"
              placeholder="Calle 123 #45-67"
              value={values.direccion || ""}
              onChange={(e) => onChange("direccion", e.target.value)}
              disabled={isLoading}
            />

            <Input
              id="telefono"
              label="Teléfono"
              placeholder="(1) 2345678"
              value={values.telefono || ""}
              onChange={(e) => onChange("telefono", e.target.value)}
              disabled={isLoading}
            />

            <Input
              id="correo"
              label="Correo"
              type="email"
              placeholder="empresa@example.com"
              value={values.correo || ""}
              onChange={(e) => onChange("correo", e.target.value)}
              disabled={isLoading}
            />

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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Empresa"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
