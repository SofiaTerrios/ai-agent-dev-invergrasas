"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { useSession, type SessionUser } from "@/lib/session";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const session = useSession();
  const user: SessionUser | undefined = session?.user;

  useEffect(() => {
    // undefined: not read yet (hydration); null: logged out
    if (session === undefined) return;
    if (session === null) {
      router.replace("/login");
      return;
    }
    if (session.user.debe_cambiar_password) {
      router.replace("/cambiar-password");
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace("/login");
    }, Math.max(session.expiresAt - Date.now(), 0));

    return () => window.clearTimeout(timeout);
  }, [router, session]);

  if (!session || session.user.debe_cambiar_password) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F8F5] text-sm font-medium text-[#486358]">
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-[#17251F]">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} user={user} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-[#17251F]/35 md:hidden" onClick={() => setSidebarOpen(false)}>
          <aside className="h-full" onClick={(event) => event.stopPropagation()}>
            <Sidebar mobile onClose={() => setSidebarOpen(false)} user={user} />
          </aside>
        </div>
      )}

      <div
        className={[
          "min-h-screen transition-[padding-left] duration-300",
          sidebarCollapsed ? "md:pl-20" : "md:pl-72",
        ].join(" ")}
      >
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          user={user}
        />
        <main className="px-4 py-8 md:px-8">{children}</main>
        <footer className="border-t border-[#DDE8E2] px-4 py-5 text-xs leading-relaxed text-[#7D8E86] md:px-8">
          <span className="font-semibold text-[#486358]">INVERGRASAS S.A.S.</span> · NIT 901.684.306-1 · CRA 78 # 41B - 20 SUR ·{" "}
          <a href="mailto:invergrasas@gmail.com" className="hover:underline">
            invergrasas@gmail.com
          </a>{" "}
          ·{" "}
          <a href="tel:+573124325472" className="hover:underline">
            312 432 5472
          </a>
        </footer>
      </div>
    </div>
  );
}
