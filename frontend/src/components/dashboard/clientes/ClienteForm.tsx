"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { checkboxClass, labelClass } from "@/components/ui/formStyles";
import { graphqlRequest } from "@/lib/graphql";
import type { ActividadEconomica } from "@/graphql/catalogos";
import {
  CREATE_CLIENTE_MUTATION,
  TIPOS_EMPRESA,
  UPDATE_CLIENTE_MUTATION,
  digitoVerificacion,
  formatNit,
  type Ciudad,
  type Cliente,
  type TipoEmpresa,
} from "@/graphql/clientes";
import CiudadCombobox from "./CiudadCombobox";
import SedeCampos, { SEDE_VACIA, sedeInput, validarSede, type SedeValores } from "./SedeCampos";

type Props = {
  // Edits this cliente; creates a new one (with its first sede) when absent
  cliente?: Cliente;
  empresaId: string;
  actividades: ActividadEconomica[];
  token?: string | null;
  puedeEditar: boolean;
  onGuardado: (cliente: Cliente) => void;
  onCancelar?: () => void;
};

type Datos = {
  razon_social: string;
  nit: string;
  registro: string;
  ciudad: Ciudad | null;
  tipos: TipoEmpresa[];
};

type Errores = Partial<Record<keyof Datos, string>>;

export default function ClienteForm({
  cliente,
  empresaId,
  actividades,
  token,
  puedeEditar,
  onGuardado,
  onCancelar,
}: Props) {
  const nuevo = !cliente;
  const [datos, setDatos] = useState<Datos>({
    razon_social: cliente?.razon_social ?? "",
    nit: formatNit(cliente?.nit, cliente?.dv),
    registro: cliente?.registro ?? "",
    ciudad: cliente?.ciudad ?? null,
    tipos: cliente?.tipos ?? ["GENERADOR"],
  });
  const [sede, setSede] = useState<SedeValores>(SEDE_VACIA);
  const [errores, setErrores] = useState<Errores>({});
  const [erroresSede, setErroresSede] = useState<Partial<Record<keyof SedeValores, string>>>({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const disabled = guardando || !puedeEditar;

  // DV preview while typing, without the one the user may have written
  const dv = digitoVerificacion(datos.nit.split("-")[0]);

  const cambiar = (cambios: Partial<Datos>) => {
    setDatos((prev) => ({ ...prev, ...cambios }));
    setError("");
  };

  const toggleTipo = (tipo: TipoEmpresa) =>
    cambiar({
      tipos: datos.tipos.includes(tipo)
        ? datos.tipos.filter((t) => t !== tipo)
        : [...datos.tipos, tipo],
    });

  const validar = () => {
    const nuevos: Errores = {};
    if (!datos.razon_social.trim()) nuevos.razon_social = "La razón social es obligatoria.";
    if (!dv) nuevos.nit = "Escribe un NIT de 5 a 15 dígitos.";
    if (!datos.ciudad) nuevos.ciudad = "Elige la ciudad.";
    if (datos.tipos.length === 0) nuevos.tipos = "Elige al menos un tipo.";
    const nuevosSede = nuevo ? validarSede(sede) : {};
    setErrores(nuevos);
    setErroresSede(nuevosSede);
    return Object.keys(nuevos).length === 0 && Object.keys(nuevosSede).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    setError("");
    const comunes = {
      razon_social: datos.razon_social.trim(),
      nit: datos.nit.trim(),
      registro: datos.registro.trim() || null,
      ciudad_id: datos.ciudad!.id,
      tipos: datos.tipos,
    };
    try {
      const guardado = nuevo
        ? (
            await graphqlRequest<{ createCliente: Cliente }>(
              CREATE_CLIENTE_MUTATION,
              {
                input: { ...comunes, empresa_id: empresaId, sede_principal: sedeInput(sede) },
              },
              token,
            )
          ).createCliente
        : (
            await graphqlRequest<{ updateCliente: Cliente }>(
              UPDATE_CLIENTE_MUTATION,
              { id: cliente.id, input: comunes },
              token,
            )
          ).updateCliente;
      onGuardado(guardado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la empresa.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="cliente-razon"
          label="Razón social"
          value={datos.razon_social}
          onChange={(e) => cambiar({ razon_social: e.target.value })}
          error={errores.razon_social}
          disabled={disabled}
        />
        <div>
          <Input
            id="cliente-nit"
            label="NIT"
            placeholder="900123456"
            value={datos.nit}
            onChange={(e) => cambiar({ nit: e.target.value })}
            error={errores.nit}
            disabled={disabled}
          />
          {dv && (
            <p className="mt-1 text-xs text-[#6B7F75]">
              Dígito de verificación: <strong>{dv}</strong>
            </p>
          )}
        </div>
        <Input
          id="cliente-registro"
          label="Registro ambiental o sanitario (opcional)"
          value={datos.registro}
          onChange={(e) => cambiar({ registro: e.target.value })}
          disabled={disabled}
        />
        <CiudadCombobox
          id="cliente-ciudad"
          value={datos.ciudad}
          onChange={(ciudad) => cambiar({ ciudad })}
          token={token}
          error={errores.ciudad}
          disabled={disabled}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Tipo de empresa</legend>
        <div className="flex flex-wrap gap-4">
          {TIPOS_EMPRESA.map((tipo) => (
            <label key={tipo.value} className="flex items-center gap-2 text-sm text-[#17251F]">
              <input
                type="checkbox"
                checked={datos.tipos.includes(tipo.value)}
                onChange={() => toggleTipo(tipo.value)}
                disabled={disabled}
                className={checkboxClass}
              />
              {tipo.label}
            </label>
          ))}
        </div>
        <FormError message={errores.tipos} />
      </fieldset>

      {nuevo && (
        <fieldset className="space-y-3 rounded-lg border border-[#DDE8E2] p-4">
          <legend className="px-1 text-sm font-semibold text-[#17251F]">
            Local de esta empresa (sede principal)
          </legend>
          <SedeCampos
            prefijo="sede-principal"
            valores={sede}
            errores={erroresSede}
            actividades={actividades}
            onChange={(cambios) => setSede((prev) => ({ ...prev, ...cambios }))}
            token={token}
            disabled={disabled}
          />
        </fieldset>
      )}

      <FormError message={error} />

      {puedeEditar && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {onCancelar && (
            <Button type="button" variant="secondary" className="sm:w-auto sm:px-6" onClick={onCancelar}>
              Cancelar
            </Button>
          )}
          <Button type="submit" className="sm:w-auto sm:px-6" isLoading={guardando}>
            {nuevo ? "Crear empresa" : "Guardar cambios"}
          </Button>
        </div>
      )}
    </form>
  );
}
