"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { puede } from "@/lib/permisos";
import MovimientosLista from "./MovimientosLista";

// Latest entregas and recolecciones on the dashboard home
export default function MovimientosRecientes() {
  const [session] = useState(() => (typeof window === "undefined" ? null : getSession()));
  if (!session || !puede(session.user.rol, "movimientos", "leer")) return null;
  return (
    <div className="space-y-3 border border-[#DDE8E2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#EEF3F0] pb-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7D8E86]">Últimas entregas</p>
        <Link href="/dashboard/entregas" className="text-sm font-semibold text-[#0F6E2E] hover:underline">
          Ver todas
        </Link>
      </div>
      <MovimientosLista filtros={{}} token={session.token} rol={session.user.rol} limite={8} />
    </div>
  );
}
