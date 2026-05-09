import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import pedidosRouter from '../../src/pedidos/pedidos.controller';
import { AppDataSource } from '../../src/data-source';
import { Empresa } from '../../src/empresas/entities/empresa.entity';
import { Cliente } from '../../src/clientes/entities/cliente.entity';
import { User } from '../../src/users/entities/user.entity';
import jwt from 'jsonwebtoken';

describe('Pedidos create E2E', () => {
  let app: express.Express;
  const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();
    app = express();
    app.use(bodyParser.json());
    app.use('/api/pedidos', pedidosRouter as any);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('creates pedido with valid data', async () => {
    const userRepo = AppDataSource.getRepository(User);
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    const user = userRepo.create({
      nombre: 'U1',
      email: 'u1@example.com',
      password: 'x',
      rol: 'empleado',
    } as any);
    await userRepo.save(user);

    const empresa = empresaRepo.create({
      razon_social: 'Test Empresa',
      nit: 'nit-test-1',
    } as any);
    await empresaRepo.save(empresa);

    const cliente = clienteRepo.create({
      nombre: 'Test Cliente',
      contacto: 'Contact',
      telefono: '555',
      correo: 'c@test.com',
      empresa_id: empresa.id,
    } as any);
    await clienteRepo.save(cliente);

    const token = jwt.sign(
      { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        empresa_id: empresa.id,
        cliente_id: cliente.id,
        producto: 'RBD',
        tipo_empaque: 'Granel',
        cantidad_kg: 100.5,
        fecha: new Date().toISOString().split('T')[0],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.empresa_id).toBe(empresa.id);
    expect(res.body.cliente_id).toBe(cliente.id);
    expect(res.body.creado_por).toBe(user.id);
  });

  it('returns 404 for non-existent empresa', async () => {
    const userRepo = AppDataSource.getRepository(User);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const empresaRepo = AppDataSource.getRepository(Empresa);

    const user = userRepo.create({
      nombre: 'U2',
      email: 'u2@example.com',
      password: 'x',
      rol: 'empleado',
    } as any);
    await userRepo.save(user);

    const empresa = empresaRepo.create({
      razon_social: 'Temp',
      nit: 'nit-temp-1',
    } as any);
    await empresaRepo.save(empresa);

    const cliente = clienteRepo.create({
      nombre: 'C2',
      contacto: 'Contact',
      telefono: '555',
      correo: 'c2@test.com',
      empresa_id: empresa.id,
    } as any);
    await clienteRepo.save(cliente);

    const token = jwt.sign(
      { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        empresa_id: '00000000-0000-0000-0000-000000000000',
        cliente_id: cliente.id,
        producto: 'RBD',
        tipo_empaque: 'Caneca',
        cantidad_kg: 50,
        fecha: new Date().toISOString().split('T')[0],
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Empresa');
  });

  it('returns 404 for non-existent cliente', async () => {
    const userRepo = AppDataSource.getRepository(User);
    const empresaRepo = AppDataSource.getRepository(Empresa);

    const user = userRepo.create({
      nombre: 'U3',
      email: 'u3@example.com',
      password: 'x',
      rol: 'empleado',
    } as any);
    await userRepo.save(user);

    const empresa = empresaRepo.create({
      razon_social: 'E3',
      nit: 'nit-e3',
    } as any);
    await empresaRepo.save(empresa);

    const token = jwt.sign(
      { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        empresa_id: empresa.id,
        cliente_id: '00000000-0000-0000-0000-000000000000',
        producto: 'Oleina',
        tipo_empaque: 'Balde',
        cantidad_kg: 25,
        fecha: new Date().toISOString().split('T')[0],
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Cliente');
  });

  it('returns 400 for invalid enum values', async () => {
    const userRepo = AppDataSource.getRepository(User);
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const clienteRepo = AppDataSource.getRepository(Cliente);

    const user = userRepo.create({
      nombre: 'U4',
      email: 'u4@example.com',
      password: 'x',
      rol: 'empleado',
    } as any);
    await userRepo.save(user);

    const empresa = empresaRepo.create({
      razon_social: 'E4',
      nit: 'nit-e4',
    } as any);
    await empresaRepo.save(empresa);

    const cliente = clienteRepo.create({
      nombre: 'C4',
      contacto: 'Contact',
      telefono: '555',
      correo: 'c4@test.com',
      empresa_id: empresa.id,
    } as any);
    await clienteRepo.save(cliente);

    const token = jwt.sign(
      { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        empresa_id: empresa.id,
        cliente_id: cliente.id,
        producto: 'InvalidProducto',
        tipo_empaque: 'InvalidEmpaque',
        cantidad_kg: 100,
        fecha: new Date().toISOString().split('T')[0],
      });

    expect(res.status).toBe(400);
  });

  it('returns 401 for unauthenticated', async () => {
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const empresa = empresaRepo.create({
      razon_social: 'E5',
      nit: 'nit-e5',
    } as any);
    await empresaRepo.save(empresa);

    const res = await request(app)
      .post('/api/pedidos')
      .send({
        empresa_id: empresa.id,
        cliente_id: 'some-id',
        producto: 'RBD',
        tipo_empaque: 'Granel',
        cantidad_kg: 100,
        fecha: new Date().toISOString().split('T')[0],
      });

    expect(res.status).toBe(401);
  });
});
