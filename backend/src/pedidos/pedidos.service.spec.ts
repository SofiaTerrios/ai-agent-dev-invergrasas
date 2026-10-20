import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from './pedidos.service';
import { PrismaService } from '../prisma/prisma.service';
import { Producto, TipoEmpaque } from '../graphql/enums';

const decimal = (value: number) => ({ toNumber: () => value });

const empleado = { id: 'user-1', rol: 'empleado' };

describe('PedidosService', () => {
  let service: PedidosService;
  let prisma: {
    empresa: { findUnique: jest.Mock };
    cliente: { findUnique: jest.Mock };
    pedido: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
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
        count: jest.fn().mockResolvedValue(0),
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
      producto: Producto.RBD,
      tipo_empaque: TipoEmpaque.Granel,
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
    prisma.userEmpresa.findUnique.mockResolvedValue({ id: 'link' });
    prisma.cliente.findUnique.mockResolvedValue({
      id: payload.cliente_id,
      empresa_id: payload.empresa_id,
    });
    prisma.pedido.create.mockResolvedValue(saved);

    const res = await service.create(payload, empleado);

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
          producto: Producto.RBD,
          tipo_empaque: TipoEmpaque.Granel,
          cantidad_kg: 100,
          fecha: '2026-02-01',
        },
        empleado,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  describe('create/update ownership checks', () => {
    const input = {
      empresa_id: 'empresa-1',
      cliente_id: 'cliente-1',
      producto: Producto.RBD,
      tipo_empaque: TipoEmpaque.Granel,
      cantidad_kg: 10,
      fecha: '2026-02-01',
    };

    beforeEach(() => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 'empresa-1' });
    });

    it('rejects creating a pedido in an empresa the user does not belong to', async () => {
      prisma.userEmpresa.findUnique.mockResolvedValue(null);

      await expect(service.create(input, empleado)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    it('rejects a cliente from another empresa when creating', async () => {
      prisma.userEmpresa.findUnique.mockResolvedValue({ id: 'link' });
      prisma.cliente.findUnique.mockResolvedValue({
        id: 'cliente-1',
        empresa_id: 'empresa-2',
      });

      await expect(service.create(input, empleado)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.pedido.create).not.toHaveBeenCalled();
    });

    it('rejects moving a pedido to a cliente of another empresa', async () => {
      prisma.pedido.findUnique.mockResolvedValue({
        id: 'pedido-1',
        empresa_id: 'empresa-1',
        cliente_id: 'cliente-1',
      });
      prisma.userEmpresa.findUnique.mockResolvedValue({ id: 'link' });
      prisma.cliente.findUnique.mockResolvedValue({
        id: 'cliente-x',
        empresa_id: 'empresa-2',
      });

      await expect(
        service.update('pedido-1', { cliente_id: 'cliente-x' }, empleado),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.pedido.update).not.toHaveBeenCalled();
    });
  });

  describe('listForUser', () => {
    it('returns an empty page when user has no associated empresas', async () => {
      prisma.userEmpresa.findMany.mockResolvedValue([]);

      const res = await service.listForUser(empleado, {});

      expect(res.edges).toEqual([]);
      expect(res.pageInfo.hasNextPage).toBe(false);
      expect(prisma.userEmpresa.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1', empresa: { deleted_at: null } },
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

      const res = await service.listForUser(empleado, {
        fecha_inicio: '2026-03-01',
        fecha_fin: '2026-03-31',
        cliente_id: 'cliente-1',
        producto: Producto.RBD,
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
        orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(res.edges).toHaveLength(1);
      expect(res.edges[0].node.cantidad_kg).toBe(150);
      expect(res.edges[0].node.cliente.nombre).toBe('Cliente Uno');
    });

    it('limits results to pedidos from associated empresas only', async () => {
      prisma.userEmpresa.findMany.mockResolvedValue([
        { user_id: 'user-1', empresa_id: 'empresa-1' },
        { user_id: 'user-1', empresa_id: 'empresa-2' },
      ]);
      prisma.pedido.findMany.mockResolvedValue([]);

      await service.listForUser(empleado, {});

      expect(prisma.pedido.findMany).toHaveBeenCalledWith({
        where: {
          empresa_id: { in: ['empresa-1', 'empresa-2'] },
        },
        include: { cliente: true },
        orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
        take: 21,
      });
    });

    it('paginates with a cursor and reports the next page', async () => {
      prisma.userEmpresa.findMany.mockResolvedValue([
        { user_id: 'user-1', empresa_id: 'empresa-1' },
      ]);
      const pedido = (id: string) => ({
        id,
        empresa_id: 'empresa-1',
        cantidad_kg: decimal(1),
        cliente: null,
      });
      prisma.pedido.findMany.mockResolvedValue([
        pedido('p3'),
        pedido('p4'),
        pedido('p5'),
      ]);
      prisma.pedido.count.mockResolvedValue(5);

      const first = await service.listForUser(empleado, {}, { first: 2 });
      expect(first.edges).toHaveLength(2);
      expect(first.pageInfo.hasNextPage).toBe(true);
      expect(first.totalCount).toBe(5);

      await service.listForUser(
        empleado,
        {},
        {
          first: 2,
          after: first.pageInfo.endCursor!,
        },
      );
      expect(prisma.pedido.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 3, skip: 1, cursor: { id: 'p4' } }),
      );
    });
  });

  describe('listForUser with empresa_id', () => {
    it('narrows to the selected empresa when the user belongs to it', async () => {
      prisma.userEmpresa.findUnique.mockResolvedValue({ id: 'link' });
      prisma.pedido.findMany.mockResolvedValue([]);

      await service.listForUser(empleado, { empresa_id: 'empresa-2' });

      expect(prisma.pedido.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { empresa_id: 'empresa-2' } }),
      );
    });

    it('forbids an empresa the user does not belong to', async () => {
      prisma.userEmpresa.findUnique.mockResolvedValue(null);

      await expect(
        service.listForUser(empleado, { empresa_id: 'empresa-x' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.pedido.findMany).not.toHaveBeenCalled();
    });

    it('lets admins list any empresa', async () => {
      prisma.pedido.findMany.mockResolvedValue([]);

      await service.listForUser({ id: 'admin', rol: 'admin' }, {});

      expect(prisma.userEmpresa.findMany).not.toHaveBeenCalled();
      expect(prisma.pedido.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
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
      service.update(
        'pedido-1',
        { cantidad_kg: 200 },
        {
          id: 'user-1',
          rol: 'empleado',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
