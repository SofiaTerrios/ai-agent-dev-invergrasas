"use client";

import Input from "@/components/ui/Input";
import { labelClass, selectClass } from "@/components/ui/formStyles";
import type { ActividadEconomica } from "@/graphql/catalogos";
import type { Ciudad } from "@/graphql/clientes";
import CiudadCombobox from "./CiudadCombobox";

export type SedeValores = {
  nombre: string;
  direccion: string;
  ciudad: Ciudad | null;
  actividad_economica_id: string;
  telefono: string;
  barrio: string;
  localidad: string;
  email: string;
};

export const SEDE_VACIA: SedeValores = {
  nombre: "",
  direccion: "",
  ciudad: null,
  actividad_economica_id: "",
  telefono: "",
  barrio: "",
  localidad: "",
  email: "",
};

export function validarSede(sede: SedeValores) {
  const errores: Partial<Record<keyof SedeValores, string>> = {};
  if (!sede.nombre.trim()) errores.nombre = "El nombre del local es obligatorio.";
  if (!sede.direccion.trim()) errores.direccion = "La dirección es obligatoria.";
  if (!sede.ciudad) errores.ciudad = "Elige la ciudad.";
  if (sede.email && !/^\S+@\S+\.\S+$/.test(sede.email)) errores.email = "Correo inválido.";
  return errores;
}

// Values for the API: empty optional fields are sent as null
export function sedeInput(sede: SedeValores) {
  const opcional = (valor: string) => valor.trim() || null;
  return {
    nombre: sede.nombre.trim(),
    direccion: sede.direccion.trim(),
    ciudad_id: sede.ciudad?.id ?? "",
    actividad_economica_id: sede.actividad_economica_id || null,
    telefono: opcional(sede.telefono),
    barrio: opcional(sede.barrio),
    localidad: opcional(sede.localidad),
    email: opcional(sede.email),
  };
}

type Props = {
  prefijo: string;
  valores: SedeValores;
  errores: Partial<Record<keyof SedeValores, string>>;
  actividades: ActividadEconomica[];
  onChange: (cambios: Partial<SedeValores>) => void;
  token?: string | null;
  disabled?: boolean;
};

// Fields of a cliente's local (IG-37)
export default function SedeCampos({
  prefijo,
  valores,
  errores,
  actividades,
  onChange,
  token,
  disabled,
}: Props) {
  const esBogota = valores.ciudad?.nombre.startsWith("Bogotá");
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        id={`${prefijo}-nombre`}
        label="Nombre del local"
        placeholder="Ej.: BAGATELLE CALLE 109"
        value={valores.nombre}
        onChange={(e) => onChange({ nombre: e.target.value })}
        error={errores.nombre}
        disabled={disabled}
      />
      <div className="space-y-1.5">
        <label htmlFor={`${prefijo}-actividad`} className={labelClass}>
          Actividad económica
        </label>
        <select
          id={`${prefijo}-actividad`}
          value={valores.actividad_economica_id}
          onChange={(e) => onChange({ actividad_economica_id: e.target.value })}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          {actividades.map((actividad) => (
            <option key={actividad.id} value={actividad.id}>
              {actividad.nombre}
            </option>
          ))}
        </select>
      </div>
      <Input
        id={`${prefijo}-direccion`}
        label="Dirección"
        value={valores.direccion}
        onChange={(e) => onChange({ direccion: e.target.value })}
        error={errores.direccion}
        disabled={disabled}
      />
      <CiudadCombobox
        id={`${prefijo}-ciudad`}
        value={valores.ciudad}
        onChange={(ciudad) => onChange({ ciudad })}
        token={token}
        error={errores.ciudad}
        disabled={disabled}
      />
      <Input
        id={`${prefijo}-barrio`}
        label="Barrio"
        value={valores.barrio}
        onChange={(e) => onChange({ barrio: e.target.value })}
        disabled={disabled}
      />
      <Input
        id={`${prefijo}-localidad`}
        label={esBogota ? "Localidad" : "Localidad (solo Bogotá)"}
        value={valores.localidad}
        onChange={(e) => onChange({ localidad: e.target.value })}
        disabled={disabled}
      />
      <Input
        id={`${prefijo}-telefono`}
        label="Teléfono"
        value={valores.telefono}
        onChange={(e) => onChange({ telefono: e.target.value })}
        disabled={disabled}
      />
      <Input
        id={`${prefijo}-email`}
        type="email"
        label="Correo"
        value={valores.email}
        onChange={(e) => onChange({ email: e.target.value })}
        error={errores.email}
        disabled={disabled}
      />
    </div>
  );
}
