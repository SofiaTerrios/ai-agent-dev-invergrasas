import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import authController from '../../src/auth/auth.controller';
import empresasController from '../../src/empresas/empresas.controller';
import { AppDataSource } from '../../src/data-source';

describe('Empresas E2E', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/auth', authController as any);
    app.use('/api/empresas', empresasController as any);
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('creates empresa when authenticated', async () => {
    // register and login
    await request(app).post('/api/auth/register').send({ nombre: 'E', email: 'e@e.com', password: 'password' });
    const login = await request(app).post('/api/auth/login').send({ email: 'e@e.com', password: 'password' });
    expect(login.status).toBe(200);
    const token = login.body.access_token || login.body.token;
    const res = await request(app).post('/api/empresas').set('Authorization', `Bearer ${token}`).send({ razon_social: 'R', nit: 'NIT1', correo: 'c@c.com' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('rejects duplicate NIT', async () => {
    // ensure existing
    const login = await request(app).post('/api/auth/login').send({ email: 'e@e.com', password: 'password' });
    const token = login.body.access_token || login.body.token;
    const res = await request(app).post('/api/empresas').set('Authorization', `Bearer ${token}`).send({ razon_social: 'R2', nit: 'NIT1', correo: 'c@c.com' });
    expect(res.status).toBe(409);
  });

  it('unauthenticated returns 401', async () => {
    const res = await request(app).post('/api/empresas').send({ razon_social: 'R3', nit: 'NIT3' });
    expect(res.status).toBe(401);
  });
});