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

describe('Clientes E2E - update', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let empresaId: string;
  let clienteId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    ({ token } = await createUser(prisma, 'comercial'));
    empresaId = (await createEmpresa(prisma)).id;
    clienteId = (await createCliente(prisma, empresaId)).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const put = (id: string) =>
    request(app.getHttpServer()).put(`/clientes/${id}`);

  it('updates cliente with valid data and returns 200', async () => {
    const res = await put(clienteId)
      .set(auth(token))
      .send({ nombre: 'Actualizado', telefono: '999' })
      .expect(200);
    expect(res.body).toMatchObject({ nombre: 'Actualizado', telefono: '999' });
  });

  it('returns 404 for a non-existent cliente', async () => {
    await put('00000000-0000-4000-8000-000000000000')
      .set(auth(token))
      .send({ nombre: 'X' })
      .expect(404);
  });

  it('returns 404 when moving to a non-existent empresa', async () => {
    await put(clienteId)
      .set(auth(token))
      .send({ empresa_id: '00000000-0000-4000-8000-000000000000' })
      .expect(404);
  });

  it('returns 401 when unauthenticated', async () => {
    await put(clienteId).send({ nombre: 'X' }).expect(401);
  });

  it('returns 400 for invalid email or empresa_id format', async () => {
    await put(clienteId)
      .set(auth(token))
      .send({ correo: 'invalid' })
      .expect(400);
    await put(clienteId)
      .set(auth(token))
      .send({ empresa_id: 'not-a-uuid' })
      .expect(400);
  });

  it('allows partial updates', async () => {
    const res = await put(clienteId)
      .set(auth(token))
      .send({ contacto: 'Nuevo' })
      .expect(200);
    expect(res.body).toMatchObject({
      contacto: 'Nuevo',
      nombre: 'Actualizado',
    });
  });

  it('allows moving to another valid empresa', async () => {
    const other = await createEmpresa(prisma);
    const res = await put(clienteId)
      .set(auth(token))
      .send({ empresa_id: other.id })
      .expect(200);
    expect(res.body.empresa_id).toBe(other.id);
  });

  it('accepts an empty update and returns the cliente', async () => {
    const res = await put(clienteId).set(auth(token)).send({}).expect(200);
    expect(res.body.id).toBe(clienteId);
  });
});
