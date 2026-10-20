import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { auth, createE2EApp, createEmpresa, createUser } from '../utils/e2e';

describe('Empresas E2E - update', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let empresaId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    ({ token } = await createUser(prisma, 'admin'));
    empresaId = (await createEmpresa(prisma, 'NIT-UPD')).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const put = (id: string) =>
    request(app.getHttpServer()).put(`/api/empresas/${id}`);

  it('updates empresa when authenticated', async () => {
    const res = await put(empresaId)
      .set(auth(token))
      .send({ direccion: 'New Addr' })
      .expect(200);
    expect(res.body).toMatchObject({ direccion: 'New Addr' });
  });

  it('returns 404 when not found', async () => {
    await put('non-existent')
      .set(auth(token))
      .send({ direccion: 'X' })
      .expect(404);
  });

  it('returns 401 when unauthenticated', async () => {
    await put(empresaId).send({ direccion: 'X' }).expect(401);
  });

  it('returns 409 on nit conflict', async () => {
    const other = await createEmpresa(prisma, 'NIT-CONF');
    await put(other.id).set(auth(token)).send({ nit: 'NIT-UPD' }).expect(409);
  });
});
