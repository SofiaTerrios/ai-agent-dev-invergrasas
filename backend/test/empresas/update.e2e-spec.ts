import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import authController from '../../src/auth/auth.controller';
import empresasController from '../../src/empresas/empresas.controller';
import { AppDataSource } from '../../src/data-source';

describe('Empresas E2E - update', () => {
  let app: express.Express;
  let token: string;
  let empresaId: string;

  beforeAll(async () => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/auth', authController as any);
    app.use('/api/empresas', empresasController as any);
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();

    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'E', email: 'edit@e.com', password: 'password' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'edit@e.com', password: 'password' });
    token = login.body.access_token || login.body.token;

    const res = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({ razon_social: 'R', nit: 'NIT-UPD', correo: 'c@c.com' });
    empresaId = res.body.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('updates empresa when authenticated', async () => {
    const res = await request(app)
      .put(`/api/empresas/${empresaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ direccion: 'New Addr' });
    expect(res.status).toBe(200);
    expect(res.body.direccion).toBe('New Addr');
  });

  it('returns 404 when not found', async () => {
    const res = await request(app)
      .put(`/api/empresas/non-existent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ direccion: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .put(`/api/empresas/${empresaId}`)
      .send({ direccion: 'X' });
    expect(res.status).toBe(401);
  });

  it('returns 409 on nit conflict', async () => {
    // create another empresa
    const res2 = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({ razon_social: 'Other', nit: 'NIT-CONF' });
    expect(res2.status).toBe(201);
    const otherId = res2.body.id;
    // try to update other to have same nit as first
    const conflict = await request(app)
      .put(`/api/empresas/${otherId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nit: 'NIT-UPD' });
    expect(conflict.status).toBe(409);
  });
});
