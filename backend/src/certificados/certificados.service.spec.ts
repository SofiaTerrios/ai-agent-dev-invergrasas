import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CertificadosService } from './certificados.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalisisPdfService } from '../utils/pdf/analisis-pdf.service';

const EMPRESA_A = '11111111-1111-1111-1111-111111111111';
const EMPRESA_B = '22222222-2222-2222-2222-222222222222';
const empleado = { id: 'user-1', rol: 'empleado' };

const futureIso = (days = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const rbdInput = (overrides: Record<string, unknown> = {}) =>
  ({
    empresa_id: EMPRESA_A,
    tipo: 'rbd',
    empresa_cliente: 'Cliente',
    lote: 'L-01',
    peso_kg: 100,
    fecha_vencimiento: futureIso(),
    parametros: {
      acidez: '0,1',
      humedad: '0,2',
      indice_yodo: '50,2',
      peroxido: '0,1',
      color_amarillo: '30,0',
      color_rojo: '3,0',
    },
    ...overrides,
  }) as any;

describe('CertificadosService', () => {
  let service: CertificadosService;
  let prismaMock: any;
  let pdfMock: any;

  beforeEach(async () => {
    prismaMock = {
      certificadoAnalisis: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      cliente: { findUnique: jest.fn() },
      userEmpresa: {
        findUnique: jest.fn().mockResolvedValue({ id: 'link' }),
        findMany: jest.fn().mockResolvedValue([{ empresa_id: EMPRESA_A }]),
      },
      parametroAnalisis: {
        createMany: jest.fn(),
      },
    };

    pdfMock = {
      generateCertificadoAnalisisPdf: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificadosService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: AnalisisPdfService,
          useValue: pdfMock,
        },
      ],
    }).compile();

    service = module.get<CertificadosService>(CertificadosService);
  });

  it('genera certificado oleina con punto_nube y guarda parámetros', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    prismaMock.certificadoAnalisis.create.mockResolvedValue({
      id: 'cert-1',
    });
    pdfMock.generateCertificadoAnalisisPdf.mockResolvedValue(
      '/static/certificados/cert-cert-1.pdf',
    );

    const response = await service.createAnalisis(
      {
        empresa_id: EMPRESA_A,
        tipo: 'oleina',
        empresa_cliente: 'YOKO SNACKS',
        nit_cliente: '901.486.714',
        lote: '19-0426',
        peso_kg: null,
        fecha_vencimiento: futureDate.toISOString().split('T')[0],
        parametros: {
          acidez: '0,07',
          humedad: '0,06',
          indice_yodo: '61,458',
          peroxido: '0,30',
          punto_nube: '5,9',
          color_amarillo: '40,0',
          color_rojo: '3,0',
        },
      },
      empleado,
    );

    expect(prismaMock.certificadoAnalisis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ empresa_id: EMPRESA_A }),
      }),
    );
    expect(prismaMock.parametroAnalisis.createMany).toHaveBeenCalled();
    expect(pdfMock.generateCertificadoAnalisisPdf).toHaveBeenCalled();
    expect(response.id).toBe('cert-1');
    expect(response.archivo_url).toBe('/api/certificados/cert-1/pdf');
  });

  it('falla cuando fecha_vencimiento no es futura', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      service.createAnalisis(
        {
          empresa_id: EMPRESA_A,
          tipo: 'rbd',
          empresa_cliente: 'Cliente',
          lote: 'L-01',
          peso_kg: 100,
          fecha_vencimiento: yesterday.toISOString(),
          parametros: {
            acidez: '0,1',
            humedad: '0,2',
            indice_yodo: '50,2',
            peroxido: '0,1',
            color_amarillo: '30,0',
            color_rojo: '3,0',
          },
        } as any,
        empleado,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('falla cuando falta punto_nube en oleina', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    await expect(
      service.createAnalisis(
        {
          empresa_id: EMPRESA_A,
          tipo: 'oleina',
          empresa_cliente: 'Cliente',
          lote: 'L-02',
          fecha_vencimiento: futureDate.toISOString(),
          parametros: {
            acidez: '0,1',
            humedad: '0,2',
            indice_yodo: '50,2',
            peroxido: '0,1',
            color_amarillo: '30,0',
            color_rojo: '3,0',
          },
        } as any,
        empleado,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('falla cuando un valor de parámetro no es numérico válido', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    await expect(
      service.createAnalisis(
        {
          empresa_id: EMPRESA_A,
          tipo: 'rbd',
          empresa_cliente: 'Cliente',
          lote: 'L-03',
          fecha_vencimiento: futureDate.toISOString(),
          parametros: {
            acidez: 'abc',
            humedad: '0,2',
            indice_yodo: '50,2',
            peroxido: '0,1',
            color_amarillo: '30,0',
            color_rojo: '3,0',
          },
        } as any,
        empleado,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  describe('multi-tenancy', () => {
    it('rejects creating a certificado for an empresa the user is not linked to', async () => {
      prismaMock.userEmpresa.findUnique.mockResolvedValue(null);

      await expect(
        service.createAnalisis(rbdInput({ empresa_id: EMPRESA_B }), empleado),
      ).rejects.toThrow(ForbiddenException);
      expect(prismaMock.certificadoAnalisis.create).not.toHaveBeenCalled();
    });

    it('rejects a cliente that belongs to another empresa', async () => {
      prismaMock.cliente.findUnique.mockResolvedValue({
        id: 'cliente-b',
        empresa_id: EMPRESA_B,
      });

      await expect(
        service.createAnalisis(
          rbdInput({ cliente_id: '33333333-3333-3333-3333-333333333333' }),
          empleado,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.certificadoAnalisis.create).not.toHaveBeenCalled();
    });

    it('lists only certificados of the user empresas', async () => {
      prismaMock.certificadoAnalisis.findMany.mockResolvedValue([]);

      await service.findAllForUser(empleado);

      expect(prismaMock.certificadoAnalisis.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { empresa_id: { in: [EMPRESA_A] } },
        }),
      );
    });

    it('hides certificados of other empresas as not found', async () => {
      prismaMock.certificadoAnalisis.findUnique.mockResolvedValue({
        id: 'cert-b',
        empresa_id: EMPRESA_B,
        parametros: [],
      });

      await expect(service.findOneForUser(empleado, 'cert-b')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPdfPath(empleado, 'cert-b')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
