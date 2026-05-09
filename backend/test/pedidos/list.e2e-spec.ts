import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PedidosController } from '../../src/pedidos/pedidos.controller';
import { PedidosService } from '../../src/pedidos/pedidos.service';

describe('GET /api/pedidos (e2e)', () => {
  let app: INestApplication;
  const pedidosService = {
    listForUser: jest.fn(),
  };
  const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

  const token = jwt.sign(
    {
      sub: 'user-1',
      email: 'user@example.com',
      nombre: 'List User',
      rol: 'empleado',
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        {
          provide: PedidosService,
          useValue: pedidosService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    pedidosService.listForUser.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns all pedidos for the authenticated user when no filters are sent', async () => {
    pedidosService.listForUser.mockResolvedValue([
      {
        id: 'pedido-1',
        empresa_id: 'empresa-1',
        cliente_id: 'cliente-1',
        producto: 'RBD',
        tipo_empaque: 'Granel',
        cantidad_kg: 100,
        fecha: '2026-03-15T00:00:00.000Z',
        cliente: { nombre: 'Cliente Uno' },
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/pedidos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cliente.nombre).toBe('Cliente Uno');
    expect(pedidosService.listForUser).toHaveBeenCalledWith('user-1', {});
  });

  it('passes fecha, cliente and producto filters to the service', async () => {
    pedidosService.listForUser.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .get('/api/pedidos')
      .query({
        fecha_inicio: '2026-03-01',
        fecha_fin: '2026-03-31',
        cliente_id: '11111111-1111-4111-8111-111111111111',
        producto: 'RBD',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(pedidosService.listForUser).toHaveBeenCalledWith('user-1', {
      fecha_inicio: '2026-03-01',
      fecha_fin: '2026-03-31',
      cliente_id: '11111111-1111-4111-8111-111111111111',
      producto: 'RBD',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app.getHttpServer()).get('/api/pedidos');

    expect(res.status).toBe(401);
    expect(pedidosService.listForUser).not.toHaveBeenCalled();
  });
});
