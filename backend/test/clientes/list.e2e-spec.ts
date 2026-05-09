import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import authController from '../../src/auth/auth.controller';
import empresasController from '../../src/empresas/empresas.controller';
import clientesController from '../../src/clientes/clientes.controller';
import { AppDataSource } from '../../src/data-source';

describe('Clientes E2E - List by Empresa', () => {
  let app: express.Express;
  let token: string;
  let empresaId: string;

  beforeAll(async () => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/auth', authController as any);
    app.use('/api/empresas', empresasController as any);
    app.use('/api/clientes', clientesController as any);
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();

    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'ListUser', email: 'listuser@test.com', password: 'password123' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'listuser@test.com', password: 'password123' });
    token = loginRes.body.access_token || loginRes.body.token;

    const empresaRes = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Empresa List',
        nit: 'NITLIST001',
        correo: 'empresalist@test.com',
      });
    empresaId = empresaRes.body.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('returns all clientes associated with the empresa', async () => {
    await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Cliente Uno',
        contacto: 'Contacto Uno',
        telefono: '1111111111',
        correo: 'clienteuno@test.com',
        empresa_id: empresaId,
      });

    await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Cliente Dos',
        contacto: 'Contacto Dos',
        telefono: '2222222222',
        correo: 'clientedos@test.com',
        empresa_id: empresaId,
      });

    const otherEmpresaRes = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Empresa Other',
        nit: 'NITLIST002',
        correo: 'empresaother@test.com',
      });
    const otherEmpresaId = otherEmpresaRes.body.id;

    await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Cliente Otro',
        contacto: 'Contacto Otro',
        telefono: '3333333333',
        correo: 'clienteotro@test.com',
        empresa_id: otherEmpresaId,
      });

    const res = await request(app)
      .get(`/api/empresas/${empresaId}/clientes`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body.every((c: any) => c.empresa_id === empresaId)).toBe(true);
  });

  it('returns empty array when empresa has no clientes', async () => {
    const emptyEmpresaRes = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Empresa Sin Clientes',
        nit: 'NITLIST003',
        correo: 'empresasinclientes@test.com',
      });

    const emptyEmpresaId = emptyEmpresaRes.body.id;
    const res = await request(app)
      .get(`/api/empresas/${emptyEmpresaId}/clientes`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 when empresa does not exist', async () => {
    const res = await request(app)
      .get('/api/empresas/00000000-0000-0000-0000-000000000000/clientes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Empresa not found');
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(`/api/empresas/${empresaId}/clientes`);

    expect(res.status).toBe(401);
  });
});
