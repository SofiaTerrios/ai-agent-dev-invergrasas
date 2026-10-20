import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { auth, createE2EApp, createEmpresa, createUser } from '../utils/e2e';

describe('Clientes E2E - create', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let empresaId: string;

  const valid = () => ({
    nombre: 'Cliente Nuevo',
    contacto: 'Contacto',
    telefono: '3001234567',
    correo: 'cliente@test.com',
    empresa_id: empresaId,
  });

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    ({ token } = await createUser(prisma, 'comercial'));
    empresaId = (await createEmpresa(prisma)).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const post = () => request(app.getHttpServer()).post('/clientes');

  it('creates cliente with a valid empresa_id', async () => {
    const res = await post().set(auth(token)).send(valid()).expect(201);
    expect(res.body).toMatchObject({
      nombre: 'Cliente Nuevo',
      empresa_id: empresaId,
    });
  });

  it('returns 404 when empresa does not exist', async () => {
    await post()
      .set(auth(token))
      .send({ ...valid(), empresa_id: '00000000-0000-4000-8000-000000000000' })
      .expect(404);
  });

  it('returns 401 when unauthenticated', async () => {
    await post().send(valid()).expect(401);
  });

  it('returns 400 for invalid email', async () => {
    await post()
      .set(auth(token))
      .send({ ...valid(), correo: 'invalid' })
      .expect(400);
  });

  it('returns 400 for missing required fields', async () => {
    await post().set(auth(token)).send({ nombre: 'Solo nombre' }).expect(400);
  });
});
