import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from './pedidos.service';
import { PrismaService } from '../prisma/prisma.service';

const decimal = (value: number) => ({ toNumber: () => value });

describe('PedidosService', () => {
  let service: PedidosService;
  let prisma: {
    empresa: { findUnique: jest.Mock };
    cliente: { findUnique: jest.Mock };
    pedido: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    userEmpresa: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      empresa: { findUnique: jest.fn() },
      cliente: { findUnique: jest.fn() },
      pedido: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userEmpresa: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get<PedidosService>(PedidosService);
  });

  it('creates pedido with valid data', async () => {
    const payload = {
      empresa_id: '11111111-1111-1111-1111-111111111111',
      cliente_id: '22222222-2222-2222-2222-222222222222',
      producto: 'RBD' as const,
      tipo_empaque: 'Granel' as const,
      cantidad_kg: 100.5,
      fecha: '2026-02-01',
    };
    const saved = {
      id: 'pedido-1',
      ...payload,
      creado_por: 'user-1',
      cantidad_kg: decimal(100.5),
      fecha: new Date(payload.fecha),
      cliente: { id: payload.cliente_id, nombre: 'Cliente Uno' },
    };

    prisma.empresa.findUnique.mockResolvedValue({ id: payload.empresa_id });
    prisma.cliente.findUnique.mockResolvedValue({ id: payload.cliente_id });
    prisma.pedido.create.mockResolvedValue(saved);

    const res = await service.create(payload, 'user-1');

    expect(prisma.pedido.create).toHaveBeenCalledWith({
      data: {
        ...payload,
        creado_por: 'user-1',
        fecha: new Date(payload.fecha),
      },
      include: { cliente: true },
    });
    expect(res.cantidad_kg).toBe(100.5);
    expect(res.cliente.nombre).toBe('Cliente Uno');
  });

  it('throws on non-existent empresa when creating', async () => {
    prisma.empresa.findUnique.mockResolvedValue(null);

    await expect(
      service.create(
        {
          empresa_id: '00000000-0000-0000-0000-000000000000',
          cliente_id: '11111111-1111-1111-1111-111111111111',
          producto: 'RBD',
          tipo_empaque: 'Granel',
          cantidad_kg: 100,
          fecha: '2026-02-01',
        },
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  describe('listForUser', () => {
    it('returns empty array when user has no associated empresas', async () => {
      prisma.userEmpresa.findMany.mockResolvedValue([]);

      const res = await service.listForUser('user-1', {});

      expect(res).toEqual([]);
      expect(prisma.userEmpresa.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
      });
      expect(prisma.pedido.findMany).not.toHaveBeenCalled();
    });

    it('applies filters and returns matching pedidos with cliente name', async () => {
      prisma.userEmpresa.findMany.mockResolvedValue([
        { user_id: 'user-1', empresa_id: 'empresa-1' },
      ]);
      prisma.pedido.findMany.mockResolvedValue([
        {
          id: 'pedido-1',
          empresa_id: 'empresa-1',
          cliente_id: 'cliente-1',
          producto: 'RBD',
          tipo_empaque: 'Granel',
          cantidad_kg: decimal(150),
          fecha: new Date('2026-03-15'),
          cliente: { id: 'cliente-1', nombre: 'Cliente Uno' },
        },
      ]);

      const res = await service.listForUser('user-1', {
        fecha_inicio: '2026-03-01',
        fecha_fin: '2026-03-31',
        cliente_id: 'cliente-1',
        producto: 'RBD' as any,
      });

      expect(prisma.pedido.findMany).toHaveBeenCalledWith({
        where: {
          empresa_id: { in: ['empresa-1'] },
          cliente_id: 'cliente-1',
          producto: 'RBD',
          fecha: {
            gte: new Date('2026-03-01'),
            lte: expect.any(Date),
          },
        },
        include: { cliente: true },
        orderBy: { fecha: 'desc' },
      });
      expect(res).toHaveLength(1);
      expect(res[0].cantidad_kg).toBe(150);
      expect(res[0].cliente.nombre).toBe('Cliente Uno');
    });

    it('limits results to pedidos from associated empresas only', async () => {
      prisma.userEmpresa.findMany.mockResolvedValue([
        { user_id: 'user-1', empresa_id: 'empresa-1' },
        { user_id: 'user-1', empresa_id: 'empresa-2' },
      ]);
      prisma.pedido.findMany.mockResolvedValue([]);

      await service.listForUser('user-1', {});

      expect(prisma.pedido.findMany).toHaveBeenCalledWith({
        where: {
          empresa_id: { in: ['empresa-1', 'empresa-2'] },
        },
        include: { cliente: true },
        orderBy: { fecha: 'desc' },
      });
    });
  });

  it('rejects pedido update when employee is not associated to empresa', async () => {
    prisma.pedido.findUnique.mockResolvedValue({
      id: 'pedido-1',
      empresa_id: 'empresa-1',
      cliente_id: 'cliente-1',
    });
    prisma.userEmpresa.findUnique.mockResolvedValue(null);

    await expect(
      service.update('pedido-1', { cantidad_kg: 200 }, {
        id: 'user-1',
        rol: 'empleado',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
