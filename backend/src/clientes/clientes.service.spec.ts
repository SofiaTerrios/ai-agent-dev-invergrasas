import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientesService', () => {
  let service: ClientesService;
  let prisma: {
    empresa: { findUnique: jest.Mock };
    cliente: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const clienteData = {
    nombre: 'Client Name',
    contacto: 'Contact Person',
    telefono: '1234567890',
    correo: 'client@example.com',
    empresa_id: 'empresa-uuid',
  };

  beforeEach(async () => {
    prisma = {
      empresa: { findUnique: jest.fn() },
      cliente: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  describe('create', () => {
    it('creates a cliente when empresa exists', async () => {
      const created = { id: 'cliente-uuid', ...clienteData };
      prisma.empresa.findUnique.mockResolvedValue({ id: 'empresa-uuid' });
      prisma.cliente.create.mockResolvedValue(created);

      await expect(service.create(clienteData)).resolves.toEqual(created);
      expect(prisma.cliente.create).toHaveBeenCalledWith({ data: clienteData });
    });

    it('throws NotFoundException when empresa does not exist', async () => {
      prisma.empresa.findUnique.mockResolvedValue(null);

      await expect(service.create(clienteData)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.cliente.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a cliente when it exists', async () => {
      prisma.cliente.findUnique.mockResolvedValue({ id: 'c1', ...clienteData });
      prisma.cliente.update.mockResolvedValue({ id: 'c1', nombre: 'Nuevo' });

      await service.update('c1', { nombre: 'Nuevo' });

      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { nombre: 'Nuevo' },
      });
      expect(prisma.empresa.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cliente does not exist', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.update('nope', { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when moving to a non-existent empresa', async () => {
      prisma.cliente.findUnique.mockResolvedValue({ id: 'c1', ...clienteData });
      prisma.empresa.findUnique.mockResolvedValue(null);

      await expect(
        service.update('c1', { empresa_id: 'other-empresa' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.cliente.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft deletes the cliente instead of deleting the row', async () => {
      prisma.cliente.findUnique.mockResolvedValue({ id: 'c1', ...clienteData });

      await service.remove('c1');

      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { deleted_at: expect.any(Date) },
      });
      expect(prisma.cliente.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cliente does not exist', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
      expect(prisma.cliente.update).not.toHaveBeenCalled();
    });
  });
});
