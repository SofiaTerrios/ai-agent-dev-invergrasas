"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { puede } from "@/lib/permisos";
import MovimientosLista from "./MovimientosLista";

// Latest entregas and recolecciones on the dashboard home
export default function MovimientosRecientes() {
  const session = useSession();
  if (!session || !puede(session.user.rol, "movimientos", "leer")) return null;
  return (
    <div className="space-y-3 border border-[#DDE8E2] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#EEF3F0] pb-3">
        <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#7D8E86]">Últimas entregas y recolecciones</h2>
        <Link href="/dashboard/entregas" className="text-sm font-semibold text-[#0F6E2E] hover:underline">
          Ver todas
        </Link>
      </div>
      <MovimientosLista filtros={{}} token={session.token} rol={session.user.rol} limite={6} />
    </div>
  );
}
