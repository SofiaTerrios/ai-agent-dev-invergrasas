"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import { getSession, type SessionUser } from "@/lib/session";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const user: SessionUser | undefined = session?.user;

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace("/login");
    }, Math.max(session.expiresAt - Date.now(), 0));

    return () => window.clearTimeout(timeout);
  }, [router, session]);

  if (!session) {
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
          userRole={user?.rol}
        />
        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
