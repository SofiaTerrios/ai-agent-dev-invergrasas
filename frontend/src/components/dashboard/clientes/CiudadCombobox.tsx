"use client";

import { useEffect, useState } from "react";
import { graphqlRequest } from "@/lib/graphql";
import { GET_CIUDADES_QUERY } from "@/graphql/catalogos";
import type { Ciudad } from "@/graphql/clientes";
import FormError from "@/components/ui/FormError";
import { labelClass } from "@/components/ui/formStyles";

type Props = {
  id: string;
  label?: string;
  value: Ciudad | null;
  onChange: (ciudad: Ciudad | null) => void;
  token?: string | null;
  error?: string;
  disabled?: boolean;
};

export const ciudadLabel = (ciudad: Ciudad) => `${ciudad.nombre} (${ciudad.departamento})`;

// "Busca la ciudad…": searches the DIVIPOLA catalog while typing (IG-35)
export default function CiudadCombobox({
  id,
  label = "Ciudad",
  value,
  onChange,
  token,
  error,
  disabled,
}: Props) {
  const [texto, setTexto] = useState(value ? ciudadLabel(value) : "");
  const [resultados, setResultados] = useState<Ciudad[]>([]);
  const [abierto, setAbierto] = useState(false);

  // Small delay so it does not query on every key
  useEffect(() => {
    if (!abierto || !token) return;
    const timeout = window.setTimeout(() => {
      graphqlRequest<{ ciudades: Ciudad[] }>(
        GET_CIUDADES_QUERY,
        { search: texto, first: 8 },
        token,
      )
        .then((data) => setResultados(data.ciudades))
        .catch(() => setResultados([]));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [texto, abierto, token]);

  return (
    <div className="relative space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={`${id}-opciones`}
        autoComplete="off"
        placeholder="Busca la ciudad…"
        value={texto}
        disabled={disabled}
        onFocus={() => setAbierto(true)}
        onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          if (value) onChange(null);
        }}
        className={`w-full rounded-lg border border-[#CFE0D2] bg-white px-3 py-2.5 text-[#3A3A3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017] ${error ? "border-red-500" : ""}`}
      />
      {abierto && resultados.length > 0 && (
        <ul
          id={`${id}-opciones`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#DDE8E2] bg-white py-1 shadow-lg"
        >
          {resultados.map((ciudad) => (
            <li
              key={ciudad.id}
              role="option"
              aria-selected={value?.id === ciudad.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(ciudad);
                setTexto(ciudadLabel(ciudad));
                setAbierto(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-[#17251F] hover:bg-[#F1F6F3]"
            >
              {ciudadLabel(ciudad)}
            </li>
          ))}
        </ul>
      )}
      <FormError message={error} />
    </div>
  );
}
