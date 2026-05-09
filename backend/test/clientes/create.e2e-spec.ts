import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import authController from '../../src/auth/auth.controller';
import empresasController from '../../src/empresas/empresas.controller';
import clientesController from '../../src/clientes/clientes.controller';
import { AppDataSource } from '../../src/data-source';

describe('Clientes E2E', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/auth', authController as any);
    app.use('/api/empresas', empresasController as any);
    app.use('/api/clientes', clientesController as any);
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('creates cliente when authenticated with valid empresa_id', async () => {
    // Register and login
    await request(app).post('/api/auth/register').send({
      nombre: 'User1',
      email: 'user1@test.com',
      password: 'password123',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@test.com', password: 'password123' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.access_token || loginRes.body.token;

    // Create an empresa
    const empresaRes = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Test Empresa',
        nit: 'NIT12345',
        correo: 'empresa@test.com',
      });
    expect(empresaRes.status).toBe(201);
    const empresaId = empresaRes.body.id;

    // Create a cliente
    const clienteRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Test Cliente',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'cliente@test.com',
        empresa_id: empresaId,
      });

    expect(clienteRes.status).toBe(201);
    expect(clienteRes.body).toHaveProperty('id');
    expect(clienteRes.body.nombre).toBe('Test Cliente');
    expect(clienteRes.body.contacto).toBe('Contact Person');
    expect(clienteRes.body.telefono).toBe('1234567890');
    expect(clienteRes.body.correo).toBe('cliente@test.com');
    expect(clienteRes.body.empresa_id).toBe(empresaId);
  });

  it('returns 404 when empresa does not exist', async () => {
    // Register and login
    await request(app).post('/api/auth/register').send({
      nombre: 'User2',
      email: 'user2@test.com',
      password: 'password123',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@test.com', password: 'password123' });
    const token = loginRes.body.access_token || loginRes.body.token;

    // Try to create cliente with non-existent empresa
    const clienteRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Test Cliente',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'cliente@test.com',
        empresa_id: '00000000-0000-0000-0000-000000000000',
      });

    expect(clienteRes.status).toBe(404);
    expect(clienteRes.body.message).toContain('Empresa not found');
  });

  it('returns 401 when unauthenticated', async () => {
    const clienteRes = await request(app).post('/api/clientes').send({
      nombre: 'Test Cliente',
      contacto: 'Contact Person',
      telefono: '1234567890',
      correo: 'cliente@test.com',
      empresa_id: '00000000-0000-0000-0000-000000000000',
    });

    expect(clienteRes.status).toBe(401);
  });

  it('returns 400 for invalid email', async () => {
    // Register and login
    await request(app).post('/api/auth/register').send({
      nombre: 'User3',
      email: 'user3@test.com',
      password: 'password123',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user3@test.com', password: 'password123' });
    const token = loginRes.body.access_token || loginRes.body.token;

    // Create an empresa
    const empresaRes = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Test Empresa',
        nit: 'NIT12346',
        correo: 'empresa@test.com',
      });
    const empresaId = empresaRes.body.id;

    // Try to create cliente with invalid email
    const clienteRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Test Cliente',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'invalid-email',
        empresa_id: empresaId,
      });

    expect(clienteRes.status).toBe(400);
    expect(clienteRes.body.message).toBe('validation error');
  });

  it('returns 400 for missing required fields', async () => {
    // Register and login
    await request(app).post('/api/auth/register').send({
      nombre: 'User4',
      email: 'user4@test.com',
      password: 'password123',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user4@test.com', password: 'password123' });
    const token = loginRes.body.access_token || loginRes.body.token;

    // Try to create cliente without required fields
    const clienteRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Test Cliente',
        // Missing contacto, telefono, correo, empresa_id
      });

    expect(clienteRes.status).toBe(400);
    expect(clienteRes.body.message).toBe('validation error');
  });
});
