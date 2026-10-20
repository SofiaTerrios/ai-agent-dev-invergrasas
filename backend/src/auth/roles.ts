import { Role } from '../graphql/enums';

const TODOS = [Role.admin, Role.comercial, Role.calidad, Role.empleado];

/**
 * Roles allowed per module and action. Single place to adjust once the
 * business confirms the final matrix.
 *
 * - admin: everything.
 * - comercial: clientes and pedidos; can read certificados.
 * - calidad: certificados.
 * - empleado: operations (pedidos), read-only elsewhere.
 */
export const PERMISOS = {
  empresas: {
    leer: TODOS,
    escribir: [Role.admin],
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
  usuarios: {
    asignarRol: [Role.admin],
  },
} as const;
