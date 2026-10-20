import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Rol } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2EApp, gql, tokenFor } from '../utils/e2e';

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

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
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

  const clienteInput = (nombre: string) => ({
    nombre,
    contacto: 'x',
    telefono: '1',
    correo: `${nombre}@rbac.test`,
    empresa_id: empresaId,
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
      const res = await gql(app, tokens.admin, CREATE_EMPRESA, {
        input: { razon_social: 'Y', nit: 'RBAC-Y' },
      });
      expect(res.errors).toBeUndefined();

      const cliente = await gql(app, tokens.comercial, CREATE_CLIENTE, {
        input: clienteInput('comercial'),
      });
      expect(cliente.errors).toBeUndefined();
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
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send(body)
        .expect(201);
    });

    it('requires a token on endpoints that used to be public', async () => {
      await request(app.getHttpServer())
        .post('/api/empresas')
        .send({ razon_social: 'W', nit: 'RBAC-W' })
        .expect(401);
    });

    it('protects clientes REST endpoints', async () => {
      await request(app.getHttpServer())
        .post('/clientes')
        .set('Authorization', `Bearer ${tokens.empleado}`)
        .send(clienteInput('empleado'))
        .expect(403);
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

    it('does not allow self-registering as admin', async () => {
      const res = await gql(
        app,
        null,
        REGISTER,
        input('hacker@rbac.test', 'admin'),
      );
      expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      expect(
        await prisma.user.count({ where: { email: 'hacker@rbac.test' } }),
      ).toBe(0);
    });

    it('lets only admins change roles', async () => {
      const denied = await gql(app, tokens.comercial, UPDATE_ROL, {
        userId: ids.empleado,
        rol: 'admin',
      });
      expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const ok = await gql<{ updateUserRol: { rol: string } }>(
        app,
        tokens.admin,
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
