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
 * - admin: every empresa; edits empresas and clientes; certificados; issues
 *   entregas choosing the conductor.
 * - comercial: clientes; reads certificados, entregas and inventario.
 * - calidad: certificados; reads the rest.
 * - entrega: issues entregas/recolecciones in their own name and sees only
 *   theirs; creates contactos.
 * - empleado: legacy role (read access), pending a business decision.
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
    // Clientes, sedes and contactos of their empresas
    leer: TODOS,
    escribir: [Role.admin, Role.comercial],
  },
  // Sedes follow the cliente permissions; contactos can also be created by
  // entrega (quick create while delivering, IG-38)
  contactos: {
    escribir: [Role.admin, Role.comercial, Role.entrega],
  },
  catalogos: {
    // Ciudades, actividades, productos, empaques
    leer: TODOS,
    gestionarActividades: [],
    gestionarProductos: [Role.admin],
  },
  vehiculos: {
    leer: TODOS,
    escribir: [Role.admin],
  },
  // Entregas y recolecciones (IG-39). Roles without `verTodos` only see
  // the ones they delivered.
  movimientos: {
    leer: [Role.admin, Role.comercial, Role.entrega, Role.empleado],
    verTodos: [Role.admin, Role.comercial, Role.empleado],
    crear: [Role.admin, Role.entrega],
    // Issue in the name of another conductor (entrega users use their own)
    elegirConductor: [Role.admin],
    anular: [],
    configurarTextos: [],
  },
  inventario: {
    leer: [Role.admin, Role.comercial, Role.entrega, Role.empleado],
    // Opening balance of envases already at the clientes
    ajustar: [],
  },
  informes: {
    exportar: [Role.admin, Role.comercial],
  },
  certificados: {
    leer: [Role.admin, Role.calidad, Role.comercial],
    escribir: [Role.admin, Role.calidad],
    anular: [Role.admin, Role.calidad],
    // Who signs every certificado (IG-21)
    configurarFirmante: [],
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
