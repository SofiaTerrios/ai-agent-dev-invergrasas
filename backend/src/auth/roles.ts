import { Role } from '../graphql/enums';

const TODOS = [
  Role.admin,
  Role.comercial,
  Role.calidad,
  Role.entrega,
  Role.empleado,
];

/**
 * Roles allowed per module and action (IG-25). Single place to adjust once
 * the business confirms the final matrix; documented in docs/PERMISOS.md.
 *
 * - super_admin: everything, always (not listed: `puede` lets it through).
 * - admin: every empresa; edits empresas, clientes and pedidos; certificados.
 * - comercial: clientes and pedidos; reads certificados.
 * - calidad: certificados; reads the rest.
 * - entrega: reads clientes; will create entregas/recolecciones (IG-39).
 * - empleado: legacy role, kept until pedidos become entregas (IG-39).
 *
 * Empresa-scoped data is also limited to the empresas linked to the user
 * (UserEmpresa), except for roles in `empresas.accesoTotal`.
 */
export const PERMISOS = {
  usuarios: {
    // Users, roles and empresa links
    gestionar: [],
  },
  empresas: {
    // Their own empresas, e.g. to pick the active one
    leer: TODOS,
    // Every empresa, without a UserEmpresa link
    accesoTotal: [Role.admin],
    crear: [],
    editar: [Role.admin],
  },
  clientes: {
    leer: TODOS,
    // Listing clientes of every empresa at once
    leerTodos: [Role.admin],
    escribir: [Role.admin, Role.comercial],
  },
  pedidos: {
    leer: TODOS,
    escribir: [Role.admin, Role.comercial, Role.empleado],
  },
  certificados: {
    leer: [Role.admin, Role.calidad, Role.comercial],
    escribir: [Role.admin, Role.calidad],
  },
} as const satisfies Record<string, Record<string, readonly Role[]>>;

export type Modulo = keyof typeof PERMISOS;
export type Accion<M extends Modulo> = keyof (typeof PERMISOS)[M];

export function puede<M extends Modulo>(
  rol: string | undefined,
  modulo: M,
  accion: Accion<M>,
) {
  if (rol === Role.super_admin) return true;
  const roles = PERMISOS[modulo][accion] as readonly string[];
  return rol !== undefined && roles.includes(rol);
}
