import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Rol } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ciudad, createE2EApp, gql, tokenFor } from '../utils/e2e';

const CREATE_EMPRESA = `
  mutation($input: CreateEmpresaInput!) { createEmpresa(input: $input) { id } }
`;
const CREATE_CLIENTE = `
  mutation($input: CreateClienteInput!) { createCliente(input: $input) { id } }
`;
const REGISTER = `
  mutation($input: RegisterInput!) { register(input: $input) { id rol } }
`;
const UPDATE_ROL = `
  mutation($userId: ID!, $rol: Role!) { updateUserRol(userId: $userId, rol: $rol) { id rol } }
`;

describe('RBAC E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tokens = {} as Record<Rol, string>;
  const ids = {} as Record<Rol, string>;
  let empresaId: string;
  let bogotaId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    bogotaId = (await ciudad(prisma)).id;
    empresaId = (
      await prisma.empresa.create({
        data: { razon_social: 'Empresa RBAC', nit: 'RBAC-1' },
      })
    ).id;

    for (const rol of Object.values(Rol)) {
      const user = await prisma.user.create({
        data: { nombre: rol, email: `${rol}@rbac.test`, password: 'x', rol },
      });
      await prisma.userEmpresa.create({
        data: { user_id: user.id, empresa_id: empresaId },
      });
      tokens[rol] = tokenFor(user);
      ids[rol] = user.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // A different valid NIT per role, so each create would succeed if allowed
  const NITS: Record<string, string> = {
    comercial: '901684306',
    calidad: '800197268',
  };
  const clienteInput = (nombre: string) => ({
    razon_social: nombre,
    nit: NITS[nombre],
    empresa_id: empresaId,
    ciudad_id: bogotaId,
    tipos: ['GENERADOR'],
    sede_principal: {
      nombre: 'Principal',
      direccion: 'Calle 1',
      ciudad_id: bogotaId,
    },
  });

  describe('GraphQL', () => {
    it('returns Forbidden when the role is not allowed', async () => {
      const res = await gql(app, tokens.empleado, CREATE_EMPRESA, {
        input: { razon_social: 'X', nit: 'RBAC-X' },
      });
      expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      expect(await prisma.empresa.count({ where: { nit: 'RBAC-X' } })).toBe(0);
    });

    it('allows the roles in the matrix', async () => {
      const res = await gql(app, tokens.super_admin, CREATE_EMPRESA, {
        input: { razon_social: 'Y', nit: 'RBAC-Y' },
      });
      expect(res.errors).toBeUndefined();

      const cliente = await gql(app, tokens.comercial, CREATE_CLIENTE, {
        input: clienteInput('comercial'),
      });
      expect(cliente.errors).toBeUndefined();
    });

    it('keeps empresa creation for super_admin, not admin', async () => {
      const res = await gql(app, tokens.admin, CREATE_EMPRESA, {
        input: { razon_social: 'A', nit: 'RBAC-A' },
      });
      expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    });

    it('gives super_admin every empresa without a UserEmpresa link', async () => {
      const otra = await prisma.empresa.create({
        data: { razon_social: 'Sin vínculo', nit: 'RBAC-SV' },
      });
      const LIST = `query { empresas(first: 100) { edges { node { id } } } }`;
      type List = { empresas: { edges: { node: { id: string } }[] } };
      const ids = (res: { data: List }) =>
        res.data.empresas.edges.map((edge) => edge.node.id);

      expect(ids(await gql<List>(app, tokens.super_admin, LIST))).toContain(
        otra.id,
      );
      expect(ids(await gql<List>(app, tokens.comercial, LIST))).not.toContain(
        otra.id,
      );
    });

    it('keeps calidad out of clientes writes', async () => {
      const res = await gql(app, tokens.calidad, CREATE_CLIENTE, {
        input: clienteInput('calidad'),
      });
      expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    });

    it('requires authentication', async () => {
      const res = await gql(app, null, `query { empresas { totalCount } }`);
      expect(res.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('REST', () => {
    it('returns 403 for a role outside the matrix and 201 for an allowed one', async () => {
      const body = { razon_social: 'Z', nit: 'RBAC-Z' };
      await request(app.getHttpServer())
        .post('/api/empresas')
        .set('Authorization', `Bearer ${tokens.comercial}`)
        .send(body)
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/empresas')
        .set('Authorization', `Bearer ${tokens.super_admin}`)
        .send(body)
        .expect(201);
    });

    it('requires a token on endpoints that used to be public', async () => {
      await request(app.getHttpServer())
        .post('/api/empresas')
        .send({ razon_social: 'W', nit: 'RBAC-W' })
        .expect(401);
    });
  });

  describe('role assignment', () => {
    const input = (email: string, rol?: string) => ({
      input: {
        nombre: 'Nuevo',
        email,
        password: 'secret123',
        ...(rol ? { rol } : {}),
      },
    });

    it('self-registration creates empleados', async () => {
      const res = await gql<{ register: { rol: string } }>(
        app,
        null,
        REGISTER,
        input('nuevo@rbac.test'),
      );
      expect(res.data.register.rol).toBe('empleado');
    });

    it('does not accept a role on self-registration', async () => {
      const res = await gql(
        app,
        null,
        REGISTER,
        input('hacker@rbac.test', 'admin'),
      );
      expect(res.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
      expect(
        await prisma.user.count({ where: { email: 'hacker@rbac.test' } }),
      ).toBe(0);
    });

    it('lets only super_admin change roles', async () => {
      for (const rol of ['comercial', 'admin'] as const) {
        const denied = await gql(app, tokens[rol], UPDATE_ROL, {
          userId: ids.empleado,
          rol: 'admin',
        });
        expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      }

      const ok = await gql<{ updateUserRol: { rol: string } }>(
        app,
        tokens.super_admin,
        UPDATE_ROL,
        {
          userId: ids.empleado,
          rol: 'calidad',
        },
      );
      expect(ok.data.updateUserRol.rol).toBe('calidad');
    });
  });
});
