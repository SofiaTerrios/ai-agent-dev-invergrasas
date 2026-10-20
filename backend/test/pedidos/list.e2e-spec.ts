import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  auth,
  createCliente,
  createE2EApp,
  createEmpresa,
  createUser,
} from '../utils/e2e';

type Page = { edges: { node: { id: string } }[]; totalCount: number };

describe('GET /api/pedidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let clienteA: string;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const empresa = (await createEmpresa(prisma)).id;
    const otraEmpresa = (await createEmpresa(prisma)).id;
    clienteA = (await createCliente(prisma, empresa)).id;
    const clienteB = (await createCliente(prisma, empresa)).id;
    const clienteOtra = (await createCliente(prisma, otraEmpresa)).id;
    const { user, token: t } = await createUser(prisma, 'empleado', [empresa]);
    token = t;

    const pedido = async (
      key: string,
      empresa_id: string,
      cliente_id: string,
      producto: string,
      fecha: string,
    ) => {
      ids[key] = (
        await prisma.pedido.create({
          data: {
            empresa_id,
            cliente_id,
            creado_por: user.id,
            producto,
            tipo_empaque: 'Granel',
            cantidad_kg: 10,
            fecha: new Date(fecha),
          },
        })
      ).id;
    };
    await pedido('marzoRbdA', empresa, clienteA, 'RBD', '2026-03-15');
    await pedido('marzoOleinaB', empresa, clienteB, 'Oleina', '2026-03-20');
    await pedido('abrilRbdA', empresa, clienteA, 'RBD', '2026-04-02');
    await pedido('otraEmpresa', otraEmpresa, clienteOtra, 'RBD', '2026-03-10');
  });

  afterAll(async () => {
    await app.close();
  });

  const list = async (query = '') =>
    (
      await request(app.getHttpServer())
        .get(`/api/pedidos${query}`)
        .set(auth(token))
        .expect(200)
    ).body as Page;

  it('returns the pedidos of the user empresas, newest first', async () => {
    const page = await list();
    expect(page.edges.map((e) => e.node.id)).toEqual([
      ids.abrilRbdA,
      ids.marzoOleinaB,
      ids.marzoRbdA,
    ]);
  });

  it('applies fecha, cliente and producto filters', async () => {
    const page = await list(
      `?fecha_inicio=2026-03-01&fecha_fin=2026-03-31&cliente_id=${clienteA}&producto=RBD`,
    );
    expect(page.edges.map((e) => e.node.id)).toEqual([ids.marzoRbdA]);
    expect(page.totalCount).toBe(1);
  });

  it('returns 400 for invalid filters', async () => {
    await request(app.getHttpServer())
      .get('/api/pedidos?producto=Aceite')
      .set(auth(token))
      .expect(400);
  });

  it('returns 401 when unauthenticated', async () => {
    await request(app.getHttpServer()).get('/api/pedidos').expect(401);
  });
});
