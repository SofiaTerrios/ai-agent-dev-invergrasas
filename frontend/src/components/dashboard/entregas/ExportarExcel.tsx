"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { downloadAuthenticatedFile } from "@/lib/api";
import { hoyEnBogota } from "@/graphql/movimientos";
import type { FiltrosMovimientos } from "./MovimientosLista";

type Props = { filtros: FiltrosMovimientos; token?: string | null };

// "Exportar a Excel" (IG-33) with the same filters as the screen
export default function ExportarExcel({ filtros, token }: Props) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const query = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v) as [string, string][],
  ).toString();

  const descargar = async () => {
    if (!token) return;
    setCargando(true);
    setError("");
    try {
      await downloadAuthenticatedFile(
        `/api/informes/movimientos.xlsx${query ? `?${query}` : ""}`,
        token,
        `movimientos-${hoyEnBogota()}.xlsx`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo exportar");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <Button variant="secondary" className="w-auto px-6" isLoading={cargando} onClick={() => void descargar()}>
        Exportar a Excel
      </Button>
      <FormError message={error} />
    </div>
  );
}
