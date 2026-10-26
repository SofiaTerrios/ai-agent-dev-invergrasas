import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogosService } from '../catalogos/catalogos.service';
import { CreateClienteInput } from '../graphql/inputs';
import { TipoEmpresa } from '../graphql/enums';

const EMPRESA = 'empresa-a';
const comercial = { id: 'user-1', rol: 'comercial' };

const cliente = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  empresa_id: EMPRESA,
  razon_social: 'Panadería',
  nit: '901684306',
  ciudad_id: 'bogota',
  sedes: [],
  contactos: [],
  ...overrides,
});

const createPrismaMock = () => {
  const prisma = {
    cliente: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'c1' }),
      update: jest.fn(),
    },
    sede: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userEmpresa: {
      findUnique: jest.fn().mockResolvedValue({ id: 'link' }),
      findMany: jest.fn().mockResolvedValue([{ empresa_id: EMPRESA }]),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma),
  );
  return prisma;
};

describe('ClientesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ClientesService;

  const input = (): CreateClienteInput => ({
    empresa_id: EMPRESA,
    razon_social: '  Panadería   La Espiga ',
    nit: '901.684.306-1',
    ciudad_id: 'bogota',
    tipos: [TipoEmpresa.GENERADOR, TipoEmpresa.GENERADOR],
    sede_principal: {
      nombre: 'Principal',
      direccion: 'Calle 1 # 2-3',
      ciudad_id: 'bogota',
    },
  });

  beforeEach(() => {
    prisma = createPrismaMock();
    const catalogos = {
      assertCiudad: jest.fn(),
      assertActividad: jest.fn(),
    } as unknown as CatalogosService;
    service = new ClientesService(
      prisma as unknown as PrismaService,
      catalogos,
    );
  });

  describe('create', () => {
    it('stores the NIT digits with its DV and creates the principal sede', async () => {
      prisma.cliente.findUnique
        .mockResolvedValueOnce(null) // NIT is free
        .mockResolvedValueOnce(cliente()); // findOne after creating

      await service.create(comercial, input());

      expect(prisma.cliente.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          razon_social: 'Panadería La Espiga',
          nit: '901684306',
          dv: '1',
          tipos: [TipoEmpresa.GENERADOR],
          sedes: {
            create: expect.objectContaining({
              nombre: 'Principal',
              principal: true,
            }) as unknown,
          },
        }) as unknown,
      });
    });

    it('rejects a NIT already used in the empresa', async () => {
      prisma.cliente.findUnique.mockResolvedValueOnce(cliente());

      await expect(service.create(comercial, input())).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.cliente.create).not.toHaveBeenCalled();
    });

    it('requires at least one tipo', async () => {
      prisma.cliente.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(comercial, { ...input(), tipos: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  it('hides clientes of other empresas as not found', async () => {
    prisma.cliente.findUnique.mockResolvedValue(
      cliente({ empresa_id: 'empresa-b' }),
    );

    await expect(service.findOne(comercial, 'c1')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove(comercial, 'c1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.cliente.update).not.toHaveBeenCalled();
  });

  it('lists only clientes of the user empresas, by name or NIT', async () => {
    await service.list(comercial, { search: '901.684' });

    expect(prisma.cliente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          empresa_id: { in: [EMPRESA] },
          OR: [
            { razon_social: { contains: '901.684', mode: 'insensitive' } },
            { nit: { startsWith: '901684' } },
          ],
        },
      }),
    );
  });

  describe('sede principal', () => {
    beforeEach(() => {
      prisma.sede.findUnique.mockResolvedValue({
        id: 's1',
        cliente_id: 'c1',
        principal: true,
      });
      prisma.cliente.findUnique.mockResolvedValue(cliente());
    });

    it('cannot stop being principal without choosing another one', async () => {
      await expect(
        service.updateSede(comercial, 's1', { principal: false }),
      ).rejects.toThrow(/siempre debe haber una/);
    });

    it('cannot be deactivated', async () => {
      await expect(service.deleteSede(comercial, 's1')).rejects.toThrow(
        /sede principal/,
      );
      expect(prisma.sede.update).not.toHaveBeenCalled();
    });
  });
});
