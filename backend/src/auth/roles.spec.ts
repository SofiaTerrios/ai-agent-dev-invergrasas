import { Role } from '../graphql/enums';
import { PERMISOS, puede } from './roles';

// One allowed and one denied permission per role (IG-25).
const CASOS: [Role, Parameters<typeof puede>[1], string, boolean][] = [
  [Role.super_admin, 'usuarios', 'gestionar', true],
  [Role.super_admin, 'empresas', 'crear', true],
  [Role.admin, 'empresas', 'editar', true],
  [Role.admin, 'usuarios', 'gestionar', false],
  [Role.admin, 'empresas', 'crear', false],
  [Role.comercial, 'clientes', 'escribir', true],
  [Role.comercial, 'certificados', 'escribir', false],
  [Role.calidad, 'certificados', 'escribir', true],
  [Role.calidad, 'clientes', 'escribir', false],
  [Role.entrega, 'clientes', 'leer', true],
  [Role.entrega, 'certificados', 'leer', false],
  [Role.empleado, 'pedidos', 'escribir', true],
  [Role.empleado, 'empresas', 'editar', false],
];

describe('puede', () => {
  it.each(CASOS)('%s → %s.%s = %s', (rol, modulo, accion, esperado) => {
    expect(puede(rol, modulo, accion as never)).toBe(esperado);
  });

  it('denies unknown or missing roles', () => {
    expect(puede(undefined, 'empresas', 'leer')).toBe(false);
    expect(puede('root', 'empresas', 'leer')).toBe(false);
  });

  it('never lists super_admin explicitly (it always passes)', () => {
    const listados = Object.values(PERMISOS).flatMap((acciones) =>
      Object.values(acciones).flat(),
    );
    expect(listados).not.toContain(Role.super_admin);
  });
});
