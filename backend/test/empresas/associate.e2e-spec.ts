import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { auth, createE2EApp, createEmpresa, createUser } from '../utils/e2e';

describe('Empresas E2E - associate user', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let userToken: string;
  let empresaId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    ({ token } = await createUser(prisma, 'admin'));
    const empleado = await createUser(prisma, 'empleado');
    userId = empleado.user.id;
    userToken = empleado.token;
    empresaId = (await createEmpresa(prisma, 'NIT-ASOC')).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const associate = (empresa: string, body: { userId: string }) =>
    request(app.getHttpServer())
      .post(`/api/empresas/${empresa}/users`)
      .send(body);

  it('associates the user and returns 201', async () => {
    const res = await associate(empresaId, { userId })
      .set(auth(token))
      .expect(201);
    expect(res.body.message).toBe('Association created successfully');
  });

  it('ignores duplicates silently', async () => {
    const res = await associate(empresaId, { userId })
      .set(auth(token))
      .expect(201);
    expect(res.body.message).toBe('Already associated');
  });

  it('fails with 401 without token', async () => {
    await associate(empresaId, { userId }).expect(401);
  });

  it('fails with 404 for an unknown user', async () => {
    await associate(empresaId, {
      userId: '00000000-0000-4000-8000-000000000000',
    })
      .set(auth(token))
      .expect(404);
  });

  it('fails with 404 for an unknown empresa', async () => {
    await associate('00000000-0000-4000-8000-000000000000', { userId })
      .set(auth(token))
      .expect(404);
  });

  it('lists the associated empresa for the user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/empresas')
      .set(auth(userToken))
      .expect(200);
    expect(res.body.edges[0].node.id).toBe(empresaId);
  });
});
