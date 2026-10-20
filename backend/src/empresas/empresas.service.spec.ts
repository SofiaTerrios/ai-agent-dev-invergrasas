import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EmpresasService } from './empresas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmpresasService', () => {
  let service: EmpresasService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      empresa: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      userEmpresa: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmpresasService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(EmpresasService);
  });

  it('creates empresa when nit is free (including soft-deleted ones)', async () => {
    prisma.empresa.findUnique.mockResolvedValue(null);
    prisma.empresa.create.mockResolvedValue({ id: 'e1', nit: '123' });

    await expect(
      service.create({ razon_social: 'X', nit: '123' }),
    ).resolves.toEqual({ id: 'e1', nit: '123' });
    expect(prisma.empresa.findUnique).toHaveBeenCalledWith({
      where: { nit: '123', deleted_at: undefined },
    });
  });

  it('throws on duplicate nit', async () => {
    prisma.empresa.findUnique.mockResolvedValue({ id: 'e1' });

    await expect(
      service.create({ razon_social: 'X', nit: '123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws on update not found', async () => {
    prisma.empresa.findUnique.mockResolvedValue(null);

    await expect(service.update('nope', { razon_social: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('list', () => {
    it('restricts non-admin users to their empresas, paginated', async () => {
      prisma.userEmpresa.findMany.mockResolvedValue([{ empresa_id: 'e2' }]);
      prisma.empresa.findMany.mockResolvedValue([{ id: 'e2', nit: 't2' }]);
      prisma.empresa.count.mockResolvedValue(1);

      const page = await service.list(
        { id: 'u1', rol: 'comercial' },
        { first: 5 },
      );

      expect(prisma.empresa.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['e2'] } },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: 6,
      });
      expect(page.edges.map((e) => e.node.nit)).toEqual(['t2']);
      expect(page.totalCount).toBe(1);
    });

    it('lists every empresa for admins', async () => {
      await service.list({ id: 'admin', rol: 'admin' });

      expect(prisma.userEmpresa.findMany).not.toHaveBeenCalled();
      expect(prisma.empresa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('associateUserToEmpresa', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.empresa.findUnique.mockResolvedValue({ id: 'e1' });
    });

    it('creates (or restores) the association', async () => {
      prisma.userEmpresa.findUnique.mockResolvedValue(null);

      const res = await service.associateUserToEmpresa('e1', 'u1');

      expect(res.message).toBe('Association created successfully');
      expect(prisma.userEmpresa.upsert).toHaveBeenCalledWith({
        where: { user_id_empresa_id: { user_id: 'u1', empresa_id: 'e1' } },
        create: { user_id: 'u1', empresa_id: 'e1' },
        update: { deleted_at: null },
      });
    });

    it('ignores duplicates', async () => {
      prisma.userEmpresa.findUnique.mockResolvedValue({ id: 'link' });

      const res = await service.associateUserToEmpresa('e1', 'u1');

      expect(res.message).toBe('Already associated');
      expect(prisma.userEmpresa.upsert).not.toHaveBeenCalled();
    });

    it('throws NotFound for a missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.associateUserToEmpresa('e1', 'nope'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
