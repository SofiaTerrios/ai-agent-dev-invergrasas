"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { fetchAllNodes, graphqlRequest } from "@/lib/graphql";
import { GET_CLIENTES_BY_EMPRESA_QUERY, type Cliente } from "@/graphql/clientes";
import {
  CREATE_PEDIDO_MUTATION,
  PRODUCTO_LABELS,
  TIPO_EMPAQUE_LABELS,
  UPDATE_PEDIDO_MUTATION,
  type Pedido,
  type PedidoInput,
  type Producto,
  type TipoEmpaque,
} from "@/graphql/pedidos";

type PedidoFormModalProps = {
  isOpen: boolean;
  empresaId: string;
  // Pedido to edit; creates a new one when not given
  pedido?: Pedido;
  onClose: () => void;
  onSaved: () => void;
  token?: string | null;
};

type FormValues = {
  cliente_id: string;
  fecha: string;
  producto: Producto | "";
  tipo_empaque: TipoEmpaque | "";
  cantidad_kg: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const selectClassName =
  "w-full rounded-lg border border-[#D5E1DB] bg-white px-4 py-2.5 text-sm text-[#17251F] focus:border-[#0F6E2E] focus:outline-none focus:ring-2 focus:ring-[#0F6E2E]/20 disabled:bg-[#F8FBF9] disabled:text-[#8A9A93]";

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function initialValues(pedido?: Pedido): FormValues {
  if (!pedido) {
    return { cliente_id: "", fecha: today(), producto: "", tipo_empaque: "", cantidad_kg: "" };
  }
  return {
    cliente_id: pedido.cliente_id,
    // Pedido dates are calendar days stored at UTC midnight
    fecha: pedido.fecha.slice(0, 10),
    producto: pedido.producto,
    tipo_empaque: pedido.tipo_empaque,
    cantidad_kg: String(pedido.cantidad_kg),
  };
}

const parseKg = (value: string) => Number(value.replace(",", "."));

function validate(values: FormValues) {
  const errors: FormErrors = {};
  if (!values.cliente_id) errors.cliente_id = "Debe seleccionar un cliente.";
  if (!values.fecha) errors.fecha = "La fecha es obligatoria.";
  if (!values.producto) errors.producto = "Debe seleccionar un producto.";
  if (!values.tipo_empaque) errors.tipo_empaque = "Debe seleccionar el empaque.";

  const kg = parseKg(values.cantidad_kg);
  if (!values.cantidad_kg.trim()) {
    errors.cantidad_kg = "La cantidad es obligatoria.";
  } else if (!Number.isFinite(kg) || kg <= 0) {
    errors.cantidad_kg = "La cantidad debe ser un número mayor que 0.";
  } else if (!/^\d+([.,]\d{1,2})?$/.test(values.cantidad_kg.trim())) {
    errors.cantidad_kg = "Usa máximo 2 decimales.";
  }
  return errors;
}

export default function PedidoFormModal({
  isOpen,
  empresaId,
  pedido,
  onClose,
  onSaved,
  token,
}: PedidoFormModalProps) {
  const isEdit = Boolean(pedido);
  const [values, setValues] = useState<FormValues>(() => initialValues(pedido));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clientesState, setClientesState] = useState<{
    empresaId: string;
    list: Pick<Cliente, "id" | "nombre">[];
  } | null>(null);
  const clientes = clientesState?.empresaId === empresaId ? clientesState.list : null;
  const loadingClientes = isOpen && clientes === null;

  // Reset the form each time the modal opens (for a new or a different pedido)
  const openFor = isOpen ? (pedido ?? "nuevo") : undefined;
  const [syncedFor, setSyncedFor] = useState(openFor);
  if (openFor !== syncedFor) {
    setSyncedFor(openFor);
    if (openFor) {
      setValues(initialValues(pedido));
      setErrors({});
      setSubmitError("");
    }
  }

  useEffect(() => {
    if (!isOpen || !token) return;
    fetchAllNodes<Cliente>(
      GET_CLIENTES_BY_EMPRESA_QUERY,
      "clientesByEmpresa",
      { empresaId },
      token,
    )
      .then((list) => setClientesState({ empresaId, list }))
      .catch((error: unknown) => {
        console.error("Error loading clientes:", error);
        setClientesState({ empresaId, list: [] });
      });
  }, [isOpen, token, empresaId]);

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

    const input: PedidoInput = {
      empresa_id: empresaId,
      cliente_id: values.cliente_id,
      fecha: values.fecha,
      producto: values.producto as Producto,
      tipo_empaque: values.tipo_empaque as TipoEmpaque,
      cantidad_kg: parseKg(values.cantidad_kg),
    };

    setIsLoading(true);
    setSubmitError("");
    try {
      if (pedido) {
        // The empresa of a pedido is not changed from this form
        const cambios: Omit<PedidoInput, "empresa_id"> = {
          cliente_id: input.cliente_id,
          fecha: input.fecha,
          producto: input.producto,
          tipo_empaque: input.tipo_empaque,
          cantidad_kg: input.cantidad_kg,
        };
        await graphqlRequest(UPDATE_PEDIDO_MUTATION, { id: pedido.id, input: cambios }, token);
      } else {
        await graphqlRequest(CREATE_PEDIDO_MUTATION, { input }, token);
      }
      onSaved();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo guardar el pedido",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#17251F]/50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pedido-modal-title"
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-[#DDE8E2] bg-white shadow-lg"
        >
          <div className="sticky top-0 border-b border-[#DDE8E2] bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 id="pedido-modal-title" className="text-lg font-bold text-[#17251F]">
                {isEdit ? "Editar pedido" : "Nuevo pedido"}
              </h2>
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

          <form onSubmit={onSubmit} noValidate className="space-y-4 px-6 py-4">
            <div>
              <label htmlFor="pedido-cliente" className="mb-2 block text-sm font-semibold text-[#17251F]">
                Cliente
              </label>
              <select
                id="pedido-cliente"
                value={values.cliente_id}
                onChange={(e) => onChange("cliente_id", e.target.value)}
                disabled={isLoading || loadingClientes}
                className={selectClassName}
              >
                <option value="">
                  {loadingClientes
                    ? "Cargando clientes..."
                    : clientes?.length
                      ? "Selecciona un cliente"
                      : "La empresa no tiene clientes"}
                </option>
                {(clientes ?? []).map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
              <FormError message={errors.cliente_id} />
            </div>

            <Input
              id="pedido-fecha"
              label="Fecha"
              type="date"
              value={values.fecha}
              onChange={(e) => onChange("fecha", e.target.value)}
              error={errors.fecha}
              disabled={isLoading}
            />

            <div>
              <label htmlFor="pedido-producto" className="mb-2 block text-sm font-semibold text-[#17251F]">
                Producto
              </label>
              <select
                id="pedido-producto"
                value={values.producto}
                onChange={(e) => onChange("producto", e.target.value)}
                disabled={isLoading}
                className={selectClassName}
              >
                <option value="">Selecciona un producto</option>
                {Object.entries(PRODUCTO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FormError message={errors.producto} />
            </div>

            <div>
              <label htmlFor="pedido-empaque" className="mb-2 block text-sm font-semibold text-[#17251F]">
                Empaque
              </label>
              <select
                id="pedido-empaque"
                value={values.tipo_empaque}
                onChange={(e) => onChange("tipo_empaque", e.target.value)}
                disabled={isLoading}
                className={selectClassName}
              >
                <option value="">Selecciona el empaque</option>
                {Object.entries(TIPO_EMPAQUE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FormError message={errors.tipo_empaque} />
            </div>

            <Input
              id="pedido-cantidad"
              label="Cantidad total (kg)"
              inputMode="decimal"
              placeholder="Ej: 1200,5"
              value={values.cantidad_kg}
              onChange={(e) => onChange("cantidad_kg", e.target.value)}
              error={errors.cantidad_kg}
              disabled={isLoading}
            />

            {submitError && <FormError message={submitError} />}

            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={onClose} variant="secondary" disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isLoading} disabled={loadingClientes}>
                {isEdit ? "Guardar cambios" : "Crear pedido"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
