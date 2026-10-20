import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { auth, createE2EApp, createEmpresa, createUser } from '../utils/e2e';

describe('Empresas E2E - list', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let asignada: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    asignada = (await createEmpresa(prisma, 'NIT-ASIG')).id;
    await createEmpresa(prisma, 'NIT-OTRA');
  });

  afterAll(async () => {
    await app.close();
  });

  const list = (token: string) =>
    request(app.getHttpServer())
      .get('/api/empresas')
      .set(auth(token))
      .expect(200);

  it('returns only empresas assigned to the user', async () => {
    const { token } = await createUser(prisma, 'empleado', [asignada]);
    const res = await list(token);
    expect(res.body).toMatchObject({
      edges: [{ node: { id: asignada } }],
      totalCount: 1,
    });
  });

  it('returns an empty page for a user with no empresas', async () => {
    const { token } = await createUser(prisma, 'empleado');
    const res = await list(token);
    expect(res.body).toMatchObject({ edges: [], totalCount: 0 });
  });

  it('returns every empresa for admins', async () => {
    const { token } = await createUser(prisma, 'admin');
    expect((await list(token)).body).toMatchObject({ totalCount: 2 });
  });

  it('returns 401 when unauthenticated', async () => {
    await request(app.getHttpServer()).get('/api/empresas').expect(401);
  });
});
