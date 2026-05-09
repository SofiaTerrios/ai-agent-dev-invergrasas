import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import authController from '../../src/auth/auth.controller';
import empresasController from '../../src/empresas/empresas.controller';
import clientesController from '../../src/clientes/clientes.controller';
import { AppDataSource } from '../../src/data-source';
import { Cliente } from '../../src/clientes/entities/cliente.entity';

describe('Clientes E2E - Delete', () => {
  let app: express.Express;
  let token: string;
  let clienteId: string;
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
      .send({ nombre: 'DeleteUser', email: 'deleteuser@test.com', password: 'password123' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'deleteuser@test.com', password: 'password123' });
    token = loginRes.body.access_token || loginRes.body.token;

    const empresaRes = await request(app)
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razon_social: 'Delete Empresa',
        nit: 'NITDELETE001',
        correo: 'empresadelete@test.com',
      });
    empresaId = empresaRes.body.id;

    const clienteRes = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Cliente Delete',
        contacto: 'Contacto Delete',
        telefono: '4444444444',
        correo: 'clientedelete@test.com',
        empresa_id: empresaId,
      });
    clienteId = clienteRes.body.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('deletes an existing cliente and removes it from database', async () => {
    const deleteRes = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);

    const repo = AppDataSource.getRepository(Cliente);
    const found = await repo.findOne({ where: { id: clienteId } });
    expect(found).toBeNull();
  });

  it('returns 404 when deleting a non-existent cliente', async () => {
    const deleteRes = await request(app)
      .delete('/api/clientes/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(404);
    expect(deleteRes.body.message).toContain('Cliente not found');
  });

  it('returns 401 when unauthenticated', async () => {
    const deleteRes = await request(app).delete('/api/clientes/00000000-0000-0000-0000-000000000000');

    expect(deleteRes.status).toBe(401);
  });
});
