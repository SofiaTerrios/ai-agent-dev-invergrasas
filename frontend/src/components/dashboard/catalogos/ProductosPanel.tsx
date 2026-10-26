"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import Modal from "@/components/ui/Modal";
import { checkboxClass, labelClass } from "@/components/ui/formStyles";
import { graphqlRequest } from "@/lib/graphql";
import {
  CREATE_EMPAQUE_MUTATION,
  CREATE_PRODUCTO_MUTATION,
  DELETE_EMPAQUE_MUTATION,
  DELETE_PRODUCTO_MUTATION,
  SET_EMPAQUES_PRODUCTO_MUTATION,
  UPDATE_EMPAQUE_MUTATION,
  UPDATE_PRODUCTO_MUTATION,
  type ProductoCatalogo,
  type TipoEmpaqueCatalogo,
} from "@/graphql/catalogos";

type Props = {
  productos: ProductoCatalogo[];
  empaques: TipoEmpaqueCatalogo[];
  editable: boolean;
  token?: string | null;
  onCambio: () => void;
};

type ProductoForm = { id?: string; nombre: string; descripcion: string; empaqueIds: string[] };
type EmpaqueForm = { id?: string; nombre: string; capacidad: string; unidad: string; retornable: boolean };

const capacidadLabel = (e: TipoEmpaqueCatalogo) =>
  e.capacidad != null ? `${e.capacidad.toLocaleString("es-CO")} ${e.unidad ?? ""}`.trim() : "—";

// Productos, tipos de empaque y sus combinaciones válidas (IG-26)
export default function ProductosPanel({ productos, empaques, editable, token, onCambio }: Props) {
  const [producto, setProducto] = useState<ProductoForm | null>(null);
  const [empaque, setEmpaque] = useState<EmpaqueForm | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setGuardando(true);
    setError("");
    try {
      await accion();
      setProducto(null);
      setEmpaque(null);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarProducto = (form: ProductoForm) =>
    ejecutar(async () => {
      const input = { nombre: form.nombre, descripcion: form.descripcion.trim() || null };
      const id = form.id
        ? (await graphqlRequest<{ updateProducto: { id: string } }>(UPDATE_PRODUCTO_MUTATION, { id: form.id, input }, token))
            .updateProducto.id
        : (await graphqlRequest<{ createProducto: { id: string } }>(CREATE_PRODUCTO_MUTATION, { input }, token))
            .createProducto.id;
      await graphqlRequest(SET_EMPAQUES_PRODUCTO_MUTATION, { productoId: id, ids: form.empaqueIds }, token);
    });

  const guardarEmpaque = (form: EmpaqueForm) =>
    ejecutar(() => {
      const input = {
        nombre: form.nombre,
        capacidad: form.capacidad ? Number(form.capacidad.replace(",", ".")) : null,
        unidad: form.unidad.trim() || null,
        retornable: form.retornable,
      };
      return form.id
        ? graphqlRequest(UPDATE_EMPAQUE_MUTATION, { id: form.id, input }, token)
        : graphqlRequest(CREATE_EMPAQUE_MUTATION, { input }, token);
    });

  return (
    <div className="space-y-8">
      <FormError message={producto || empaque ? "" : error} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#17251F]">Productos</h2>
          {editable && (
            <Button className="w-auto px-6" onClick={() => setProducto({ nombre: "", descripcion: "", empaqueIds: [] })}>
              + Producto
            </Button>
          )}
        </div>
        <ul className="divide-y divide-[#EEF3F0] rounded-lg border border-[#DDE8E2] bg-white">
          {productos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-semibold text-[#17251F]">{p.nombre}</p>
                <p className="text-xs text-[#6B7F75]">
                  Empaques: {p.empaques.map((e) => e.nombre).join(", ") || "ninguno"}
                </p>
              </div>
              {editable && (
                <span className="flex gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    className="text-[#0F6E2E] hover:underline"
                    onClick={() =>
                      setProducto({
                        id: p.id,
                        nombre: p.nombre,
                        descripcion: p.descripcion ?? "",
                        empaqueIds: p.empaques.map((e) => e.id),
                      })
                    }
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-[#D63A2F] hover:underline"
                    onClick={() => void ejecutar(() => graphqlRequest(DELETE_PRODUCTO_MUTATION, { id: p.id }, token))}
                  >
                    Eliminar
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#17251F]">Tipos de empaque</h2>
          {editable && (
            <Button
              className="w-auto px-6"
              onClick={() => setEmpaque({ nombre: "", capacidad: "", unidad: "", retornable: false })}
            >
              + Empaque
            </Button>
          )}
        </div>
        <ul className="divide-y divide-[#EEF3F0] rounded-lg border border-[#DDE8E2] bg-white">
          {empaques.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-semibold text-[#17251F]">
                  {e.nombre}
                  {e.retornable && (
                    <span className="ml-2 rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#0F6E56]">
                      Retornable
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#6B7F75]">Capacidad: {capacidadLabel(e)}</p>
              </div>
              {editable && (
                <span className="flex gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    className="text-[#0F6E2E] hover:underline"
                    onClick={() =>
                      setEmpaque({
                        id: e.id,
                        nombre: e.nombre,
                        capacidad: e.capacidad != null ? String(e.capacidad) : "",
                        unidad: e.unidad ?? "",
                        retornable: e.retornable,
                      })
                    }
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-[#D63A2F] hover:underline"
                    onClick={() => void ejecutar(() => graphqlRequest(DELETE_EMPAQUE_MUTATION, { id: e.id }, token))}
                  >
                    Eliminar
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#83948D]">
          Los empaques retornables son los que cuentan en el inventario de envases por cliente.
        </p>
      </section>

      {producto && (
        <Modal titulo={producto.id ? "Editar producto" : "Nuevo producto"} onClose={() => setProducto(null)}>
          <div className="space-y-4">
            <Input
              id="producto-nombre"
              label="Nombre"
              value={producto.nombre}
              onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
            />
            <Input
              id="producto-descripcion"
              label="Descripción (opcional)"
              value={producto.descripcion}
              onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
            />
            <fieldset className="space-y-2">
              <legend className={labelClass}>Se entrega en</legend>
              {empaques.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm text-[#17251F]">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={producto.empaqueIds.includes(e.id)}
                    onChange={() =>
                      setProducto({
                        ...producto,
                        empaqueIds: producto.empaqueIds.includes(e.id)
                          ? producto.empaqueIds.filter((id) => id !== e.id)
                          : [...producto.empaqueIds, e.id],
                      })
                    }
                  />
                  {e.nombre}
                </label>
              ))}
            </fieldset>
            <FormError message={error} />
            <div className="flex gap-3">
              <Button variant="secondary" className="w-auto px-6" onClick={() => setProducto(null)}>
                Cancelar
              </Button>
              <Button
                className="w-auto px-6"
                isLoading={guardando}
                disabled={!producto.nombre.trim()}
                onClick={() => void guardarProducto(producto)}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {empaque && (
        <Modal titulo={empaque.id ? "Editar empaque" : "Nuevo empaque"} onClose={() => setEmpaque(null)}>
          <div className="space-y-4">
            <Input
              id="empaque-nombre"
              label="Nombre"
              placeholder="Ej.: Galón"
              value={empaque.nombre}
              onChange={(e) => setEmpaque({ ...empaque, nombre: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="empaque-capacidad"
                label="Capacidad"
                inputMode="decimal"
                value={empaque.capacidad}
                onChange={(e) => setEmpaque({ ...empaque, capacidad: e.target.value })}
              />
              <Input
                id="empaque-unidad"
                label="Unidad"
                placeholder="Ej.: litros"
                value={empaque.unidad}
                onChange={(e) => setEmpaque({ ...empaque, unidad: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#17251F]">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={empaque.retornable}
                onChange={(e) => setEmpaque({ ...empaque, retornable: e.target.checked })}
              />
              Retornable (se recoge vacío)
            </label>
            <FormError message={error} />
            <div className="flex gap-3">
              <Button variant="secondary" className="w-auto px-6" onClick={() => setEmpaque(null)}>
                Cancelar
              </Button>
              <Button
                className="w-auto px-6"
                isLoading={guardando}
                disabled={!empaque.nombre.trim()}
                onClick={() => void guardarEmpaque(empaque)}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
