import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CertificadosService } from './certificados.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalisisPdfService } from '../utils/pdf/analisis-pdf.service';

describe('CertificadosService', () => {
  let service: CertificadosService;
  let prismaMock: any;
  let pdfMock: any;

  beforeEach(async () => {
    prismaMock = {
      certificadoAnalisis: {
        create: jest.fn(),
        update: jest.fn(),
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

    const response = await service.createAnalisis({
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
    });

    expect(prismaMock.certificadoAnalisis.create).toHaveBeenCalled();
    expect(prismaMock.parametroAnalisis.createMany).toHaveBeenCalled();
    expect(pdfMock.generateCertificadoAnalisisPdf).toHaveBeenCalled();
    expect(response.id).toBe('cert-1');
    expect(response.archivo_url).toContain('/static/certificados/');
  });

  it('falla cuando fecha_vencimiento no es futura', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      service.createAnalisis({
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
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('falla cuando falta punto_nube en oleina', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    await expect(
      service.createAnalisis({
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
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('falla cuando un valor de parámetro no es numérico válido', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    await expect(
      service.createAnalisis({
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
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
