import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { auth, createE2EApp, createUser } from '../utils/e2e';

describe('Empresas E2E - create', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    ({ token } = await createUser(prisma, 'admin'));
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates empresa when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/empresas')
      .set(auth(token))
      .send({
        razon_social: 'Empresa Uno',
        nit: 'NIT-1',
        correo: 'uno@test.com',
      })
      .expect(201);
    expect(res.body).toMatchObject({
      razon_social: 'Empresa Uno',
      nit: 'NIT-1',
    });
  });

  it('rejects duplicate NIT with 409', async () => {
    await request(app.getHttpServer())
      .post('/api/empresas')
      .set(auth(token))
      .send({ razon_social: 'Otra', nit: 'NIT-1' })
      .expect(409);
  });

  it('returns 400 for invalid data', async () => {
    await request(app.getHttpServer())
      .post('/api/empresas')
      .set(auth(token))
      .send({ razon_social: 'Sin NIT', correo: 'no-es-correo' })
      .expect(400);
  });

  it('returns 401 when unauthenticated', async () => {
    await request(app.getHttpServer())
      .post('/api/empresas')
      .send({ razon_social: 'X', nit: 'NIT-X' })
      .expect(401);
  });
});
