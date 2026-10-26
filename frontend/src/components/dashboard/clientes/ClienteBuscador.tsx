"use client";

import { useEffect, useState } from "react";
import { connectionNodes, graphqlRequest, type Connection } from "@/lib/graphql";
import { GET_CLIENTES_QUERY, formatNit, type Cliente } from "@/graphql/clientes";
import { labelClass } from "@/components/ui/formStyles";

type Props = {
  empresaId: string;
  token?: string | null;
  onSelect: (cliente: Cliente) => void;
};

// "Buscar y editar empresa existente": by part of the name or the NIT (IG-36)
export default function ClienteBuscador({ empresaId, token, onSelect }: Props) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!token || !empresaId || texto.trim().length < 2) return;
    const timeout = window.setTimeout(() => {
      graphqlRequest<{ clientes: Connection<Cliente> }>(
        GET_CLIENTES_QUERY,
        { empresaId, search: texto, first: 8 },
        token,
      )
        .then((data) => setResultados(connectionNodes(data.clientes)))
        .catch(() => setResultados([]));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [texto, empresaId, token]);

  const visibles = texto.trim().length >= 2 ? resultados : [];

  return (
    <div className="relative space-y-1.5">
      <label htmlFor="buscar-cliente" className={labelClass}>
        Buscar empresa por razón social o NIT
      </label>
      <input
        id="buscar-cliente"
        role="combobox"
        aria-expanded={abierto}
        aria-controls="buscar-cliente-opciones"
        autoComplete="off"
        placeholder="Ej.: Bagatelle o 900123"
        value={texto}
        onFocus={() => setAbierto(true)}
        onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        className="w-full rounded-lg border border-[#CFE0D2] bg-white px-3 py-2.5 text-[#3A3A3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]"
      />
      {abierto && visibles.length > 0 && (
        <ul
          id="buscar-cliente-opciones"
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[#DDE8E2] bg-white py-1 shadow-lg"
        >
          {visibles.map((cliente) => (
            <li
              key={cliente.id}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(cliente);
                setTexto("");
                setAbierto(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-[#F1F6F3]"
            >
              <span className="font-semibold text-[#17251F]">{cliente.razon_social}</span>
              {cliente.nit && (
                <span className="ml-2 text-[#6B7F75]">NIT {formatNit(cliente.nit, cliente.dv)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
