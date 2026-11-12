"use client";

import { usePathname } from "next/navigation";
import { rolLabel } from "@/lib/permisos";
import { getUserInitials, type SessionUser } from "@/lib/session";

// Title of each section, by route prefix (longest first)
const SECCIONES: [string, string][] = [
  ["/dashboard/entregas/nueva", "Nueva entrega o recolección"],
  ["/dashboard/entregas", "Entregas y recolecciones"],
  ["/dashboard/certificados/nuevo", "Nuevo certificado de análisis"],
  ["/dashboard/certificados", "Certificados de análisis"],
  ["/dashboard/inventario", "Inventario de envases"],
  ["/dashboard/clientes", "Clientes"],
  ["/dashboard/catalogos", "Productos y catálogos"],
  ["/dashboard/empresas", "Empresas"],
  ["/dashboard/usuarios", "Usuarios"],
];

const seccion = (pathname: string) =>
  SECCIONES.find(([ruta]) => pathname === ruta || pathname.startsWith(`${ruta}/`))?.[1] ?? "Inicio";

type HeaderProps = {
  onOpenSidebar: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  user?: SessionUser;
};

function formatToday() {
  const date = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return date.charAt(0).toUpperCase() + date.slice(1);
}

export default function Header({
  onOpenSidebar,
  sidebarCollapsed,
  onToggleSidebar,
  user,
}: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[#DDE8E2] bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">

        {/* Left: toggle + title */}
        <div className="flex items-center gap-3">
          {/* Mobile burger */}
          <button
            type="button"
            aria-label="Abrir menú lateral"
            onClick={onOpenSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D5E1DB] text-[#6B7F75] transition-colors hover:bg-[#F1F6F3] md:hidden"
          >
            ☰
          </button>

          {/* Desktop toggle */}
          <button
            type="button"
            aria-label={
              sidebarCollapsed
                ? "Expandir menú lateral"
                : "Contraer menú lateral"
            }
            onClick={onToggleSidebar}
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-[#D5E1DB] text-[#6B7F75] transition-colors hover:bg-[#F1F6F3] md:inline-flex"
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>

          {/* Divider */}
          <div className="hidden h-7 w-px bg-[#DDE8E2] md:block" />

          {/* Title block */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#9AADA5]">
              Invergrasas
            </p>
            <p className="text-base font-medium text-[#17251F]">{seccion(pathname)}</p>
          </div>
        </div>

        {/* Right: date · user */}
        <div className="flex items-center gap-3">
          {/* Date chip */}
          <div className="hidden items-center gap-1.5 rounded-md border border-[#DDE8E2] bg-[#F7FAF8] px-2.5 py-1.5 text-xs text-[#63766D] sm:flex">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {formatToday()}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 rounded-full border border-[#D5E1DB] bg-[#F1F6F3] py-1 pl-1 pr-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#085041] text-[11px] font-medium text-[#9FE1CB]">
              {getUserInitials(user)}
            </span>
            <span className="hidden text-xs leading-tight sm:block">
              <span className="block font-medium text-[#17251F]">{user?.nombre || user?.email}</span>
              <span className="block text-[#63766D]">{rolLabel(user?.rol)}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}