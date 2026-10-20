import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2EApp, gql, tokenFor } from '../utils/e2e';

const LIST = `
  query($empresaId: ID!, $first: Int, $after: String) {
    clientesByEmpresa(empresaId: $empresaId, first: $first, after: $after) {
      edges { cursor node { id nombre } }
      pageInfo { endCursor hasNextPage }
      totalCount
    }
  }
`;

describe('Clientes E2E - List (cursor pagination)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let empresaId: string;
  let ids: string[];

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const user = await prisma.user.create({
      data: {
        nombre: 'Admin',
        email: 'admin-list@test.com',
        password: 'x',
        rol: 'admin',
      },
    });
    token = tokenFor(user);
    empresaId = (
      await prisma.empresa.create({
        data: { razon_social: 'Empresa Lista', nit: 'LIST-1' },
      })
    ).id;

    // Same created_at for all rows to make sure the id tiebreaker keeps the order stable
    const created_at = new Date('2026-01-01T00:00:00Z');
    await prisma.cliente.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        nombre: `Cliente ${i}`,
        contacto: 'x',
        telefono: '1',
        correo: `c${i}@test.com`,
        empresa_id: empresaId,
        created_at,
      })),
    });
    ids = (
      await prisma.cliente.findMany({
        where: { empresa_id: empresaId },
        orderBy: { id: 'desc' },
      })
    ).map((c) => c.id);
  });

  afterAll(async () => {
    delete process.env.PAGINATION_MAX_LIMIT;
    await app.close();
  });

  it('walks every page without gaps or duplicates', async () => {
    const seen: string[] = [];
    let after: string | null = null;
    let pages = 0;

    do {
      const res = await gql(app, token, LIST, { empresaId, first: 2, after });
      expect(res.body.errors).toBeUndefined();
      const page = res.body.data.clientesByEmpresa;
      expect(page.edges.length).toBeLessThanOrEqual(2);
      expect(page.totalCount).toBe(5);
      seen.push(...page.edges.map((e: { node: { id: string } }) => e.node.id));
      after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
      pages++;
    } while (after);

    expect(pages).toBe(3);
    expect(seen).toEqual(ids);
  });

  it('never returns more rows than the configured maximum', async () => {
    process.env.PAGINATION_MAX_LIMIT = '3';
    const res = await gql(app, token, LIST, { empresaId, first: 100 });
    delete process.env.PAGINATION_MAX_LIMIT;

    expect(res.body.data.clientesByEmpresa.edges).toHaveLength(3);
    expect(res.body.data.clientesByEmpresa.pageInfo.hasNextPage).toBe(true);
  });

  it('rejects an invalid cursor', async () => {
    const res = await gql(app, token, LIST, {
      empresaId,
      after: 'not-a-cursor!',
    });
    expect(res.body.errors?.[0]?.message).toBe('Cursor inválido');
  });

  it('paginates the REST pedidos listing via query params', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/pedidos?first=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toMatchObject({
      edges: [],
      pageInfo: { hasNextPage: false },
    });

    await request(app.getHttpServer())
      .get('/api/pedidos?first=0')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
