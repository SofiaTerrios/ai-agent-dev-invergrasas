import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2EApp, createEmpresa, createUser, gql } from '../utils/e2e';

const USUARIO_FIELDS = `id email rol activo debe_cambiar_password tiene_firma empresas { id }`;
const CREATE = `
  mutation($input: CreateUsuarioInput!) { createUsuario(input: $input) { ${USUARIO_FIELDS} } }
`;
const UPDATE = `
  mutation($id: ID!, $input: UpdateUsuarioInput!) { updateUsuario(id: $id, input: $input) { ${USUARIO_FIELDS} } }
`;
const LIST = `
  query($incluirInactivos: Boolean) {
    usuarios(incluirInactivos: $incluirInactivos) { totalCount edges { node { id activo } } }
  }
`;
const DESACTIVAR = `mutation($id: ID!) { desactivarUsuario(id: $id) { id activo } }`;
const REACTIVAR = `mutation($id: ID!) { reactivarUsuario(id: $id) { id activo } }`;
const LOGIN = `
  mutation($input: LoginInput!) {
    login(input: $input) { access_token user { rol debe_cambiar_password } }
  }
`;
const CHANGE_PASSWORD = `
  mutation($input: ChangePasswordInput!) { changePassword(input: $input) { message } }
`;

// 1x1 transparent PNG
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

type Usuario = {
  id: string;
  email: string;
  rol: string;
  activo: boolean;
  debe_cambiar_password: boolean;
  tiene_firma: boolean;
  empresas: { id: string }[];
};

describe('Usuarios E2E (super admin)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let superToken: string;
  let superId: string;
  let adminToken: string;
  let empresaId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const superAdmin = await createUser(prisma, 'super_admin');
    superToken = superAdmin.token;
    superId = superAdmin.user.id;
    adminToken = (await createUser(prisma, 'admin')).token;
    empresaId = (await createEmpresa(prisma)).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const crear = (email: string, extra: Record<string, unknown> = {}) =>
    gql<{ createUsuario: Usuario }>(app, superToken, CREATE, {
      input: {
        nombre: 'Trabajador',
        email,
        password: 'inicial123',
        rol: 'entrega',
        ...extra,
      },
    });

  const login = (email: string, password: string) =>
    gql<{
      login: {
        access_token: string;
        user: { rol: string; debe_cambiar_password: boolean };
      };
    }>(app, null, LOGIN, { input: { email, password } });

  it('keeps the module for super_admin only', async () => {
    const list = await gql(app, adminToken, LIST);
    expect(list.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

    const create = await gql(app, adminToken, CREATE, {
      input: {
        nombre: 'X',
        email: 'x@usuarios.test',
        password: 'inicial123',
        rol: 'admin',
      },
    });
    expect(create.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(
      await prisma.user.count({ where: { email: 'x@usuarios.test' } }),
    ).toBe(0);
  });

  it('creates a user with role, empresas and firma, and audits it', async () => {
    const res = await crear('entrega@usuarios.test', {
      documento: '123',
      empresa_ids: [empresaId],
      firma: PNG,
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.createUsuario).toMatchObject({
      rol: 'entrega',
      activo: true,
      debe_cambiar_password: true,
      tiene_firma: true,
      empresas: [{ id: empresaId }],
    });
    const audit = await prisma.auditLog.findFirst({
      where: { entidad_id: res.data.createUsuario.id, accion: 'usuario.crear' },
    });
    expect(audit?.actor_id).toBe(superId);
  });

  it('rejects an invalid firma', async () => {
    const res = await crear('firma@usuarios.test', {
      firma: 'data:text/plain;base64,aG9sYQ==',
    });
    expect(res.errors?.[0]?.message).toMatch(/PNG o JPEG/);
  });

  it('asks to change the initial password and clears the flag after it', async () => {
    await crear('nuevo@usuarios.test');

    const first = await login('nuevo@usuarios.test', 'inicial123');
    expect(first.data.login.user.debe_cambiar_password).toBe(true);

    const changed = await gql(
      app,
      first.data.login.access_token,
      CHANGE_PASSWORD,
      {
        input: { password_actual: 'inicial123', password_nueva: 'propia123' },
      },
    );
    expect(changed.errors).toBeUndefined();

    const again = await login('nuevo@usuarios.test', 'propia123');
    expect(again.data.login.user.debe_cambiar_password).toBe(false);
  });

  it('replaces the empresas and audits role changes', async () => {
    const { data } = await crear('cambios@usuarios.test', {
      empresa_ids: [empresaId],
    });
    const otra = await createEmpresa(prisma);

    const res = await gql<{ updateUsuario: Usuario }>(app, superToken, UPDATE, {
      id: data.createUsuario.id,
      input: { rol: 'comercial', empresa_ids: [otra.id], firma: null },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.updateUsuario).toMatchObject({
      rol: 'comercial',
      empresas: [{ id: otra.id }],
      tiene_firma: false,
    });
    const audit = await prisma.auditLog.findFirst({
      where: {
        entidad_id: data.createUsuario.id,
        accion: 'usuario.cambiar_rol',
      },
    });
    expect(audit?.detalle).toEqual({ de: 'entrega', a: 'comercial' });
  });

  it('applies a role change to existing tokens', async () => {
    const { user, token } = await createUser(prisma, 'empleado');
    const before = await gql(app, token, LIST);
    expect(before.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

    await prisma.user.update({
      where: { id: user.id },
      data: { rol: 'super_admin' },
    });
    const after = await gql(app, token, LIST);
    expect(after.errors).toBeUndefined();
    await prisma.user.update({
      where: { id: user.id },
      data: { rol: 'empleado' },
    });
  });

  describe('desactivar', () => {
    let usuarioId: string;
    let usuarioToken: string;

    beforeAll(async () => {
      await crear('baja@usuarios.test');
      const ingreso = await login('baja@usuarios.test', 'inicial123');
      usuarioToken = ingreso.data.login.access_token;
      usuarioId = (
        await prisma.user.findUniqueOrThrow({
          where: { email: 'baja@usuarios.test' },
        })
      ).id;
    });

    it('blocks login and existing tokens of a deactivated user', async () => {
      const res = await gql<{ desactivarUsuario: Usuario }>(
        app,
        superToken,
        DESACTIVAR,
        { id: usuarioId },
      );
      expect(res.data.desactivarUsuario.activo).toBe(false);

      const ingreso = await login('baja@usuarios.test', 'inicial123');
      expect(ingreso.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');

      await request(app.getHttpServer())
        .get('/api/empresas')
        .set('Authorization', `Bearer ${usuarioToken}`)
        .expect(401);
    });

    it('lists deactivated users only when asked', async () => {
      const activos = await gql<{
        usuarios: { edges: { node: { id: string } }[] };
      }>(app, superToken, LIST);
      expect(activos.data.usuarios.edges.map((e) => e.node.id)).not.toContain(
        usuarioId,
      );

      const todos = await gql<{
        usuarios: { edges: { node: { id: string } }[] };
      }>(app, superToken, LIST, { incluirInactivos: true });
      expect(todos.data.usuarios.edges.map((e) => e.node.id)).toContain(
        usuarioId,
      );
    });

    it('reactivates the user', async () => {
      const res = await gql<{ reactivarUsuario: Usuario }>(
        app,
        superToken,
        REACTIVAR,
        { id: usuarioId },
      );
      expect(res.data.reactivarUsuario.activo).toBe(true);
      const ingreso = await login('baja@usuarios.test', 'inicial123');
      expect(ingreso.errors).toBeUndefined();
    });
  });

  describe('último super admin', () => {
    it('cannot deactivate or demote the last active super_admin', async () => {
      const otro = await crear('super2@usuarios.test', {
        rol: 'super_admin',
      });
      const otroId = otro.data.createUsuario.id;

      // With two super admins one can go
      const demote = await gql(app, superToken, UPDATE, {
        id: otroId,
        input: { rol: 'admin' },
      });
      expect(demote.errors).toBeUndefined();

      // Now superId is the last one
      const self = await gql(app, superToken, UPDATE, {
        id: superId,
        input: { rol: 'admin' },
      });
      expect(self.errors?.[0]?.message).toMatch(/al menos un Super/);
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: superId } })).rol,
      ).toBe('super_admin');
    });

    it('cannot deactivate yourself', async () => {
      const res = await gql(app, superToken, DESACTIVAR, { id: superId });
      expect(res.errors?.[0]?.message).toMatch(/propio usuario/);
    });
  });
});
