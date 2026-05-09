import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { Cliente } from './entities/cliente.entity';
import { Empresa } from '../empresas/entities/empresa.entity';

describe('ClientesService', () => {
  let service: ClientesService;
  let mockClienteRepo: any;
  let mockEmpresaRepo: any;

  beforeEach(async () => {
    mockClienteRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
    };

    mockEmpresaRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: getRepositoryToken(Cliente),
          useValue: mockClienteRepo,
        },
        {
          provide: getRepositoryToken(Empresa),
          useValue: mockEmpresaRepo,
        },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  describe('create', () => {
    it('should create a cliente when empresa exists', async () => {
      const clienteData = {
        nombre: 'Client Name',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'client@example.com',
        empresa_id: 'empresa-uuid',
      };

      const createdCliente = {
        id: 'cliente-uuid',
        ...clienteData,
        created_at: new Date(),
      };

      mockEmpresaRepo.findOne.mockResolvedValue({
        id: 'empresa-uuid',
        razon_social: 'Test Empresa',
      });

      mockClienteRepo.create.mockReturnValue(clienteData);
      mockClienteRepo.save.mockResolvedValue(createdCliente);

      const result = await service.create(clienteData);

      expect(result).toEqual(createdCliente);
      expect(mockEmpresaRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'empresa-uuid' },
      });
      expect(mockClienteRepo.create).toHaveBeenCalledWith(clienteData);
      expect(mockClienteRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when empresa does not exist', async () => {
      const clienteData = {
        nombre: 'Client Name',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'client@example.com',
        empresa_id: 'invalid-empresa-uuid',
      };

      mockEmpresaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(clienteData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmpresaRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'invalid-empresa-uuid' },
      });
    });
  });

  describe('update', () => {
    it('should update a cliente when it exists', async () => {
      const clienteId = 'cliente-uuid';
      const updateData = {
        nombre: 'Updated Name',
        telefono: '9876543210',
      };

      const existingCliente = {
        id: clienteId,
        nombre: 'Old Name',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'client@example.com',
        empresa_id: 'empresa-uuid',
        created_at: new Date(),
      };

      const updatedCliente = {
        ...existingCliente,
        ...updateData,
      };

      mockClienteRepo.findOne.mockResolvedValue(existingCliente);
      mockClienteRepo.merge.mockReturnValue(updatedCliente);
      mockClienteRepo.save.mockResolvedValue(updatedCliente);

      const result = await service.update(clienteId, updateData);

      expect(result).toEqual(updatedCliente);
      expect(mockClienteRepo.findOne).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
      expect(mockClienteRepo.merge).toHaveBeenCalledWith(
        existingCliente,
        updateData,
      );
      expect(mockClienteRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when cliente does not exist', async () => {
      const clienteId = 'invalid-cliente-uuid';
      const updateData = {
        nombre: 'Updated Name',
      };

      mockClienteRepo.findOne.mockResolvedValue(null);

      await expect(service.update(clienteId, updateData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockClienteRepo.findOne).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
    });

    it('should throw NotFoundException when updating empresa_id to non-existent empresa', async () => {
      const clienteId = 'cliente-uuid';
      const updateData = {
        empresa_id: 'invalid-empresa-uuid',
      };

      const existingCliente = {
        id: clienteId,
        nombre: 'Client Name',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'client@example.com',
        empresa_id: 'old-empresa-uuid',
        created_at: new Date(),
      };

      mockClienteRepo.findOne.mockResolvedValue(existingCliente);
      mockEmpresaRepo.findOne.mockResolvedValue(null);

      await expect(service.update(clienteId, updateData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmpresaRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'invalid-empresa-uuid' },
      });
    });

    it('should allow updating other fields without checking empresa when empresa_id is same', async () => {
      const clienteId = 'cliente-uuid';
      const updateData = {
        nombre: 'Updated Name',
      };

      const existingCliente = {
        id: clienteId,
        nombre: 'Old Name',
        contacto: 'Contact Person',
        telefono: '1234567890',
        correo: 'client@example.com',
        empresa_id: 'empresa-uuid',
        created_at: new Date(),
      };

      const updatedCliente = {
        ...existingCliente,
        ...updateData,
      };

      mockClienteRepo.findOne.mockResolvedValue(existingCliente);
      mockClienteRepo.merge.mockReturnValue(updatedCliente);
      mockClienteRepo.save.mockResolvedValue(updatedCliente);

      const result = await service.update(clienteId, updateData);

      expect(result).toEqual(updatedCliente);
      // empresaRepo should not be called since empresa_id is not being updated
      expect(mockEmpresaRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAllByEmpresa', () => {
    it('should return clientes for an existing empresa', async () => {
      const empresaId = 'empresa-uuid';
      const clientes = [
        {
          id: 'cliente-1',
          nombre: 'Cliente 1',
          contacto: 'Contacto 1',
          telefono: '1234567890',
          correo: 'cliente1@test.com',
          empresa_id: empresaId,
          created_at: new Date(),
        },
      ];

      mockEmpresaRepo.findOne.mockResolvedValue({
        id: empresaId,
        razon_social: 'Empresa Test',
      });
      mockClienteRepo.find.mockResolvedValue(clientes);

      const result = await service.findAllByEmpresa(empresaId);

      expect(result).toEqual(clientes);
      expect(mockEmpresaRepo.findOne).toHaveBeenCalledWith({
        where: { id: empresaId },
      });
      expect(mockClienteRepo.find).toHaveBeenCalledWith({
        where: { empresa_id: empresaId },
      });
    });

    it('should return empty array when empresa exists but has no clientes', async () => {
      const empresaId = 'empresa-uuid-without-clientes';

      mockEmpresaRepo.findOne.mockResolvedValue({
        id: empresaId,
        razon_social: 'Empresa Sin Clientes',
      });
      mockClienteRepo.find.mockResolvedValue([]);

      const result = await service.findAllByEmpresa(empresaId);

      expect(result).toEqual([]);
      expect(mockClienteRepo.find).toHaveBeenCalledWith({
        where: { empresa_id: empresaId },
      });
    });

    it('should throw NotFoundException when empresa does not exist', async () => {
      const empresaId = 'invalid-empresa-uuid';
      mockEmpresaRepo.findOne.mockResolvedValue(null);

      await expect(service.findAllByEmpresa(empresaId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmpresaRepo.findOne).toHaveBeenCalledWith({
        where: { id: empresaId },
      });
      expect(mockClienteRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a cliente when it exists', async () => {
      const clienteId = 'cliente-uuid';
      mockClienteRepo.findOne.mockResolvedValue({
        id: clienteId,
        nombre: 'Client Name',
      });
      mockClienteRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(clienteId);

      expect(mockClienteRepo.findOne).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
      expect(mockClienteRepo.delete).toHaveBeenCalledWith({ id: clienteId });
    });

    it('should throw NotFoundException when deleting non-existent cliente', async () => {
      const clienteId = 'invalid-cliente-uuid';
      mockClienteRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(clienteId)).rejects.toThrow(NotFoundException);
      expect(mockClienteRepo.findOne).toHaveBeenCalledWith({
        where: { id: clienteId },
      });
      expect(mockClienteRepo.delete).not.toHaveBeenCalled();
    });
  });
});
