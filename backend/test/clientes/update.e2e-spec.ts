import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import authController from '../../src/auth/auth.controller';
import empresasController from '../../src/empresas/empresas.controller';
import clientesController from '../../src/clientes/clientes.controller';
import { AppDataSource } from '../../src/data-source';

describe('Clientes E2E - Update', () => {
  let app: express.Express;
  let clienteId: string;
  let empresaId: string;
  let token: string;

  beforeAll(async () => {
    app = express();
    app.use(bodyParser.json());
    app.use('/api/auth', authController as any);
    app.use('/api/empresas', empresasController as any);
    app.use('/api/clientes', clientesController as any);
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();

    // Register and login
    await request(app).post('/api/auth/register').send({
      nombre: 'UpdateUser',
      email: 'updateuser@test.com',
      password: 'password123',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'updateuser@test.com', password: 'password123' });
    token = loginRes.body.access_token || loginRes.body.token;

    // Create an empresa
    const empresaRes = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Update Test Empresa',
        nit: 'NIT99999',
        correo: 'empresa@test.com',
      });
    empresaId = empresaRes.body.id;

    // Create a cliente
    const clienteRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Original Client',
        contacto: 'Original Contact',
        telefono: '1111111111',
        correo: 'original@test.com',
        empresa_id: empresaId,
      });
    clienteId = clienteRes.body.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('updates cliente with valid data and returns 200', async () => {
    const updateRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Updated Client',
        telefono: '2222222222',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.nombre).toBe('Updated Client');
    expect(updateRes.body.telefono).toBe('2222222222');
    expect(updateRes.body.contacto).toBe('Original Contact');
    expect(updateRes.body.correo).toBe('original@test.com');
  });

  it('returns 404 when updating non-existent cliente', async () => {
    const updateRes = await request(app)
      .put(`/api/clientes/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Updated Client',
      });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body.message).toContain('Cliente not found');
  });

  it('returns 404 when updating empresa_id to non-existent empresa', async () => {
    const updateRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        empresa_id: '00000000-0000-0000-0000-000000000000',
      });

    expect(updateRes.status).toBe(404);
    expect(updateRes.body.message).toContain('Empresa not found');
  });

  it('returns 401 when unauthenticated', async () => {
    const updateRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .send({
        nombre: 'Updated Client',
      });

    expect(updateRes.status).toBe(401);
  });

  it('returns 400 for invalid email format', async () => {
    const updateRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        correo: 'invalid-email',
      });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.message).toBe('validation error');
  });

  it('returns 400 for invalid empresa_id format', async () => {
    const updateRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        empresa_id: 'not-a-uuid',
      });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.message).toBe('validation error');
  });

  it('allows partial updates with only some fields', async () => {
    const updateRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        correo: 'newemail@test.com',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.correo).toBe('newemail@test.com');
    expect(updateRes.body.nombre).toBe('Updated Client');
    expect(updateRes.body.telefono).toBe('2222222222');
  });

  it('allows updating to a different valid empresa', async () => {
    // Create a second empresa
    const empresa2Res = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Second Empresa',
        nit: 'NIT88888',
        correo: 'empresa2@test.com',
      });
    const empresa2Id = empresa2Res.body.id;

    // Update cliente to use the new empresa
    const updateRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        empresa_id: empresa2Id,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.empresa_id).toBe(empresa2Id);
  });

  it('accepts empty object update and returns existing cliente', async () => {
    const beforeUpdate = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(beforeUpdate.status).toBe(200);
    expect(beforeUpdate.body.id).toBe(clienteId);
  });
});
