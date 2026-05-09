"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getUserInitials, type SessionUser } from "@/lib/session";
import Image from "next/image";
import {
  LayoutDashboard,
  FileBadge,
  Building2,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
};

const navGroups: NavGroup[] = [
  {
    title: "Visión general",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/dashboard/certificados", label: "Certificados", icon: FileBadge },
    ],
  },
  {
    title: "Administración",
    adminOnly: true,
    items: [
      { href: "/dashboard/empresas", label: "Empresas", icon: Building2, adminOnly: true },
      { href: "/dashboard/clientes", label: "Clientes", icon: Users, adminOnly: true },
   ],
  },
];

type SidebarProps = {
  collapsed?: boolean;
  mobile?: boolean;
  onClose?: () => void;
  user?: SessionUser;
};

export default function Sidebar({
  collapsed = false,
  mobile = false,
  onClose,
  user,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isCollapsed = collapsed && !mobile;
  const userName = user?.nombre || user?.email || "Mi cuenta";

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <aside
      className={[
        "flex h-full flex-col border-r border-[#DDE8E2] bg-[#F8FBF9] transition-[width] duration-300",
        mobile ? "w-72" : isCollapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[#DDE8E2] px-4 flex-shrink-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#E1F5EE]">
          <Image src="/logo.jpg" alt="Invergrasas" width={24} height={24} className="rounded" />
        </div>
        {!isCollapsed && (
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#83948D]">
            Operaciones
          </p>
        )}
      </div>

      {/* Mobile close */}
      {mobile && (
        <div className="px-4 pt-4">
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D5E1DB] text-[#244136] hover:bg-[#EAF3EE] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav
        className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-5"
        aria-label="Navegación dashboard"
      >
        {navGroups.map((group) => {
          if (group.adminOnly && user?.rol !== "admin") return null;

          return (
            <div key={group.title} className="flex flex-col gap-1">
              {!isCollapsed && (
                <p className="px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#7C8F86]">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                if (item.adminOnly && user?.rol !== "admin") return null;
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? item.label : undefined}
                    className={[
                      "flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
                      "text-[#345247] hover:bg-[#EAF3EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E2E]",
                      isActive ? "bg-[#DDECE4] text-[#0F6E2E] font-medium" : "font-normal",
                      isCollapsed ? "justify-center px-0" : "",
                    ].join(" ")}
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
                      <Icon
                        size={18}
                        strokeWidth={1.75}
                        className={isActive ? "text-[#0F6E2E]" : "text-[#7C8F86]"}
                      />
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-medium text-[#0F6E56]">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-[#DDE8E2] p-3 flex-shrink-0">
        <div
          className={[
            "flex items-center gap-2.5 rounded-lg bg-white p-2.5 ring-1 ring-[#E4ECE7]",
            isCollapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2F80ED] text-[11px] font-bold text-white">
            {getUserInitials(user)}
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#17251F]">{userName}</p>
                <p className="text-[11px] text-[#6B7F75]">Mi cuenta</p>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[#F2C8BE] text-[#D63A2F] transition-colors hover:bg-[#FFF1EE]"
              >
                <LogOut size={15} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
        {isCollapsed && (
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="mt-2 flex h-9 w-full items-center justify-center rounded-lg border border-[#F2C8BE] text-[#D63A2F] transition-colors hover:bg-[#FFF1EE]"
          >
            <LogOut size={15} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </aside>
  );
}