type HeaderProps = {
  onOpenSidebar: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  userRole?: string;
  notificationCount?: number;
};

function formatToday() {
  const date = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return date.charAt(0).toUpperCase() + date.slice(1);
}

function getRoleInitials(role: string) {
  return role.slice(0, 2).toUpperCase();
}

export default function Header({
  onOpenSidebar,
  sidebarCollapsed,
  onToggleSidebar,
  userRole = "usuario",
  notificationCount = 0,
}: HeaderProps) {
  const roleLabel =
    userRole.charAt(0).toUpperCase() + userRole.slice(1);

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
              Panel operativo
            </p>
            <h1 className="text-base font-medium text-[#17251F]">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Right: status · date · notifications · user */}
        <div className="flex items-center gap-3">
          {/* Online status */}
          <div className="hidden items-center gap-1.5 text-xs text-[#9AADA5] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            En línea
          </div>

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

          {/* Notifications */}
          <button
            type="button"
            aria-label={`Notificaciones${
              notificationCount > 0 ? ` (${notificationCount})` : ""
            }`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#DDE8E2] text-[#6B7F75] transition-colors hover:bg-[#F1F6F3]"
          >
            🔔
            {notificationCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {/* User pill */}
          <button
            type="button"
            aria-label="Menú de usuario"
            className="flex items-center gap-2 rounded-full border border-[#D5E1DB] bg-[#F1F6F3] py-1 pl-1 pr-3 transition-colors hover:bg-[#E6EEE9]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#085041] text-[11px] font-medium text-[#9FE1CB]">
              {getRoleInitials(userRole)}
            </span>
            <span className="text-xs font-medium text-[#17251F]">
              {roleLabel}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}