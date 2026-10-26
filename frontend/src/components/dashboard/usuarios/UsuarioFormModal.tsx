"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { fetchAllNodes, graphqlRequest } from "@/lib/graphql";
import { ROLES, ROL_LABELS, type Rol } from "@/lib/permisos";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import {
  CREATE_USUARIO_MUTATION,
  FIRMA_MAX_BYTES,
  GET_USUARIO_FIRMA_QUERY,
  UPDATE_USUARIO_MUTATION,
  type CreateUsuarioInput,
  type UpdateUsuarioInput,
  type Usuario,
} from "@/graphql/usuarios";

type Props = {
  // Edits this user; creates a new one when absent
  usuario?: Usuario;
  onClose: () => void;
  onSuccess: () => void;
  token?: string | null;
};

type Values = {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  documento: string;
  telefono: string;
  empresa_ids: string[];
};

type Errors = Partial<Record<keyof Values | "firma", string>>;

const selectClass =
  "w-full rounded-lg border border-[#CFE0D2] bg-white px-3 py-2.5 text-sm text-[#3A3A3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]";

function validate(values: Values, isNew: boolean) {
  const errors: Errors = {};
  if (!values.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = "Ingresa un correo válido.";
  if (isNew && values.password.length < 6) {
    errors.password = "La contraseña inicial debe tener mínimo 6 caracteres.";
  }
  return errors;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Empty strings are sent as "not set"
const optional = (value: string) => value.trim() || undefined;

export default function UsuarioFormModal({ usuario, onClose, onSuccess, token }: Props) {
  const isNew = !usuario;
  const [values, setValues] = useState<Values>({
    nombre: usuario?.nombre ?? "",
    email: usuario?.email ?? "",
    password: "",
    rol: usuario?.rol ?? "entrega",
    documento: usuario?.documento ?? "",
    telefono: usuario?.telefono ?? "",
    empresa_ids: usuario?.empresas.map((empresa) => empresa.id) ?? [],
  });
  // undefined: unchanged; null: removed; string: new image (data URL)
  const [firma, setFirma] = useState<string | null | undefined>(undefined);
  const [firmaActual, setFirmaActual] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[] | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchAllNodes<Empresa>(GET_EMPRESAS_QUERY, "empresas", {}, token)
      .then(setEmpresas)
      .catch(() => setEmpresas([]));
  }, [token]);

  useEffect(() => {
    if (!token || !usuario?.tiene_firma) return;
    graphqlRequest<{ usuario: { firma: string | null } }>(
      GET_USUARIO_FIRMA_QUERY,
      { id: usuario.id },
      token,
    )
      .then((data) => setFirmaActual(data.usuario.firma))
      .catch(() => setFirmaActual(null));
  }, [token, usuario]);

  const onChange = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const toggleEmpresa = (id: string) =>
    onChange(
      "empresa_ids",
      values.empresa_ids.includes(id)
        ? values.empresa_ids.filter((empresaId) => empresaId !== id)
        : [...values.empresa_ids, id],
    );

  const onFirmaFile = async (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, firma: "La firma debe ser PNG o JPEG." }));
      return;
    }
    if (file.size > FIRMA_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, firma: "La firma debe pesar máximo 300 KB." }));
      return;
    }
    setErrors((prev) => ({ ...prev, firma: undefined }));
    setFirma(await readAsDataUrl(file));
  };

  const preview = firma === undefined ? firmaActual : firma;
  const showFirma = values.rol === "entrega" || Boolean(preview);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, isNew);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setSubmitError("");
    try {
      if (isNew) {
        const input: CreateUsuarioInput = {
          nombre: values.nombre.trim(),
          email: values.email.trim(),
          password: values.password,
          rol: values.rol,
          documento: optional(values.documento),
          telefono: optional(values.telefono),
          empresa_ids: values.empresa_ids,
          firma: firma ?? undefined,
        };
        await graphqlRequest(CREATE_USUARIO_MUTATION, { input }, token);
      } else {
        const input: UpdateUsuarioInput = {
          nombre: values.nombre.trim(),
          email: values.email.trim(),
          rol: values.rol,
          documento: values.documento.trim() || null,
          telefono: values.telefono.trim() || null,
          empresa_ids: values.empresa_ids,
          ...(firma !== undefined ? { firma } : {}),
        };
        await graphqlRequest(UPDATE_USUARIO_MUTATION, { id: usuario.id, input }, token);
      }
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el usuario.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#17251F]/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-[#DDE8E2] bg-white shadow-lg">
          <div className="sticky top-0 border-b border-[#DDE8E2] bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#17251F]">
                {isNew ? "Nuevo usuario" : "Editar usuario"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7F75] hover:bg-[#F1F6F3]"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 px-6 py-4" noValidate>
            <Input
              id="usuario-nombre"
              label="Nombre"
              value={values.nombre}
              onChange={(e) => onChange("nombre", e.target.value)}
              error={errors.nombre}
              disabled={isLoading}
            />
            <Input
              id="usuario-email"
              type="email"
              label="Correo (usuario de ingreso)"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              error={errors.email}
              disabled={isLoading}
            />
            {isNew && (
              <Input
                id="usuario-password"
                type="text"
                autoComplete="off"
                label="Contraseña inicial"
                placeholder="Se pedirá cambiarla en el primer ingreso"
                value={values.password}
                onChange={(e) => onChange("password", e.target.value)}
                error={errors.password}
                disabled={isLoading}
              />
            )}

            <div className="space-y-1.5">
              <label htmlFor="usuario-rol" className="block text-sm font-medium text-[#1B4D1E]">
                Rol
              </label>
              <select
                id="usuario-rol"
                value={values.rol}
                onChange={(e) => onChange("rol", e.target.value as Rol)}
                disabled={isLoading}
                className={selectClass}
              >
                {ROLES.map((rol) => (
                  <option key={rol} value={rol}>
                    {ROL_LABELS[rol]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="usuario-documento"
                label="Documento"
                value={values.documento}
                onChange={(e) => onChange("documento", e.target.value)}
                disabled={isLoading}
              />
              <Input
                id="usuario-telefono"
                label="Teléfono"
                value={values.telefono}
                onChange={(e) => onChange("telefono", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-[#1B4D1E]">Empresas asignadas</legend>
              {empresas === null ? (
                <p className="text-sm text-[#6B7F75]">Cargando empresas...</p>
              ) : empresas.length === 0 ? (
                <p className="text-sm text-[#6B7F75]">No hay empresas registradas.</p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#DDE8E2] p-2">
                  {empresas.map((empresa) => (
                    <label
                      key={empresa.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[#17251F] hover:bg-[#F8FBF9]"
                    >
                      <input
                        type="checkbox"
                        checked={values.empresa_ids.includes(empresa.id)}
                        onChange={() => toggleEmpresa(empresa.id)}
                        disabled={isLoading}
                        className="h-4 w-4 accent-[#0F6E2E]"
                      />
                      {empresa.razon_social}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {showFirma && (
              <div className="space-y-2">
                <label htmlFor="usuario-firma" className="block text-sm font-medium text-[#1B4D1E]">
                  Firma (para los recibos de entrega)
                </label>
                {preview && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#DDE8E2] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview */}
                    <img src={preview} alt="Firma" className="h-16 max-w-[200px] object-contain" />
                    <button
                      type="button"
                      onClick={() => setFirma(null)}
                      className="text-xs font-semibold text-[#D63A2F] hover:underline"
                    >
                      Quitar firma
                    </button>
                  </div>
                )}
                <input
                  id="usuario-firma"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => void onFirmaFile(e.target.files?.[0])}
                  disabled={isLoading}
                  className="block w-full text-sm text-[#6B7F75] file:mr-3 file:rounded-md file:border-0 file:bg-[#E1F5EE] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#0F6E2E]"
                />
                <p className="text-xs text-[#83948D]">PNG o JPEG, máximo 300 KB.</p>
                <FormError message={errors.firma} />
              </div>
            )}

            <FormError message={submitError} />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {isNew ? "Crear usuario" : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
