// Mirror of backend/src/auth/roles.ts, only to hide menus and buttons:
// the API enforces the permissions. Keep both in sync (docs/PERMISOS.md).

export const ROLES = [
  "super_admin",
  "admin",
  "comercial",
  "calidad",
  "entrega",
  "empleado",
] as const;

export type Rol = (typeof ROLES)[number];

export const ROL_LABELS: Record<Rol, string> = {
  super_admin: "Super Administrador",
  admin: "Administrador",
  comercial: "Comercial",
  calidad: "Calidad",
  entrega: "Entrega",
  empleado: "Empleado",
};

const TODOS: Rol[] = ["admin", "comercial", "calidad", "entrega", "empleado"];

// super_admin is never listed: it can do everything.
const PERMISOS = {
  usuarios: { gestionar: [] },
  empresas: {
    leer: TODOS,
    accesoTotal: ["admin"],
    crear: [],
    editar: ["admin"],
  },
  clientes: {
    leer: TODOS,
    escribir: ["admin", "comercial"],
  },
  contactos: {
    escribir: ["admin", "comercial", "entrega"],
  },
  catalogos: {
    leer: TODOS,
    gestionarActividades: [],
    gestionarProductos: ["admin"],
  },
  vehiculos: {
    leer: TODOS,
    escribir: ["admin"],
  },
  pedidos: {
    leer: TODOS,
    escribir: ["admin", "comercial", "empleado"],
  },
  certificados: {
    leer: ["admin", "calidad", "comercial"],
    escribir: ["admin", "calidad"],
    anular: ["admin", "calidad"],
    configurarFirmante: [],
  },
} as const satisfies Record<string, Record<string, readonly Rol[]>>;

export type Modulo = keyof typeof PERMISOS;

export function puede<M extends Modulo>(
  rol: string | undefined,
  modulo: M,
  accion: keyof (typeof PERMISOS)[M],
) {
  if (rol === "super_admin") return true;
  const roles = PERMISOS[modulo][accion] as readonly string[];
  return rol !== undefined && roles.includes(rol);
}

export function rolLabel(rol?: string) {
  return rol && rol in ROL_LABELS ? ROL_LABELS[rol as Rol] : "Usuario";
}
