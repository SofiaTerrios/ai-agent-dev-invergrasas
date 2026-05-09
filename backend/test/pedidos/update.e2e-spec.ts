import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import pedidosRouter from '../../src/pedidos/pedidos.controller';
import { AppDataSource } from '../../src/data-source';
import { Empresa } from '../../src/empresas/entities/empresa.entity';
import { Cliente } from '../../src/clientes/entities/cliente.entity';
import { User } from '../../src/users/entities/user.entity';
import { UserEmpresa } from '../../src/empresas/entities/user-empresa.entity';
import { Pedido } from '../../src/pedidos/entities/pedido.entity';
import jwt from 'jsonwebtoken';

describe('Pedidos update E2E', () => {
  let app: express.Express;
  let empresaId: string;
  let clienteId: string;
  let pedidoId: string;
  let empleadoToken: string;
  let otroToken: string;
  let adminToken: string;
  const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();
    app = express();
    app.use(bodyParser.json());
    app.use('/api/pedidos', pedidosRouter as any);

    const userRepo = AppDataSource.getRepository(User);
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const clienteRepo = AppDataSource.getRepository(Cliente);
    const ueRepo = AppDataSource.getRepository(UserEmpresa);
    const pedidoRepo = AppDataSource.getRepository(Pedido);

    const empleado = await userRepo.save(
      userRepo.create({
        nombre: 'Empleado Pedido',
        email: 'empleado-pedido@example.com',
        password: 'x',
        rol: 'empleado',
      } as any),
    );

    const otroEmpleado = await userRepo.save(
      userRepo.create({
        nombre: 'Otro Empleado',
        email: 'otro-empleado@example.com',
        password: 'x',
        rol: 'empleado',
      } as any),
    );

    const admin = await userRepo.save(
      userRepo.create({
        nombre: 'Admin Pedido',
        email: 'admin-pedido@example.com',
        password: 'x',
        rol: 'admin',
      } as any),
    );

    const empresa = await empresaRepo.save(
      empresaRepo.create({
        razon_social: 'Empresa Pedido',
        nit: 'nit-pedido-update',
      } as any),
    );
    empresaId = empresa.id;

    const cliente = await clienteRepo.save(
      clienteRepo.create({
        nombre: 'Cliente Pedido',
        contacto: 'Contacto',
        telefono: '123',
        correo: 'cliente-pedido@example.com',
        empresa_id: empresa.id,
      } as any),
    );
    clienteId = cliente.id;

    await ueRepo.save(
      ueRepo.create({
        user_id: empleado.id,
        empresa_id: empresa.id,
      } as any),
    );

    const pedido = await pedidoRepo.save(
      pedidoRepo.create({
        empresa_id: empresa.id,
        cliente_id: cliente.id,
        producto: 'RBD',
        tipo_empaque: 'Granel',
        cantidad_kg: 100,
        fecha: new Date('2026-03-01'),
        creado_por: empleado.id,
      } as any),
    );
    pedidoId = pedido.id;

    empleadoToken = jwt.sign(
      {
        sub: empleado.id,
        email: empleado.email,
        nombre: empleado.nombre,
        rol: empleado.rol,
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
    otroToken = jwt.sign(
      {
        sub: otroEmpleado.id,
        email: otroEmpleado.email,
        nombre: otroEmpleado.nombre,
        rol: otroEmpleado.rol,
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
    adminToken = jwt.sign(
      {
        sub: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        rol: admin.rol,
      },
      JWT_SECRET,
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('updates existing pedido and returns 200', async () => {
    const res = await request(app)
      .put(`/api/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({
        cantidad_kg: 250,
        producto: 'Oleina',
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(pedidoId);
    expect(Number(res.body.cantidad_kg)).toBe(250);
    expect(res.body.producto).toBe('Oleina');
    expect(res.body.empresa_id).toBe(empresaId);
    expect(res.body.cliente_id).toBe(clienteId);
  });

  it('returns 400 when enum values are invalid', async () => {
    const res = await request(app)
      .put(`/api/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({
        producto: 'INVALID',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('validation error');
  });

  it('returns 400 when cantidad_kg is invalid', async () => {
    const res = await request(app)
      .put(`/api/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({
        cantidad_kg: -5,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('validation error');
  });

  it('returns 404 when pedido does not exist', async () => {
    const res = await request(app)
      .put('/api/pedidos/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${empleadoToken}`)
      .send({
        cantidad_kg: 10,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Pedido not found');
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).put(`/api/pedidos/${pedidoId}`).send({
      cantidad_kg: 150,
    });

    expect(res.status).toBe(401);
  });

  it('returns 403 when employee is not associated to pedido empresa', async () => {
    const res = await request(app)
      .put(`/api/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${otroToken}`)
      .send({
        cantidad_kg: 175,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('allows admin to update pedido without empresa association', async () => {
    const res = await request(app)
      .put(`/api/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipo_empaque: 'Caneca',
      });

    expect(res.status).toBe(200);
    expect(res.body.tipo_empaque).toBe('Caneca');
  });
});
