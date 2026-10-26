import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CertificadosService } from './certificados.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalisisPdfService } from '../utils/pdf/analisis-pdf.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { FirmanteService } from './firmante.service';
import {
  CertificadoTipoDto,
  CreateCertificadoDto,
} from './dto/create-certificado.dto';

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
  }) as CreateCertificadoDto;

const createPrismaMock = () => ({
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
});

const createPdfMock = () => ({
  generateCertificadoAnalisisPdf: jest.fn(),
});

const FIRMANTE = {
  id: 'adriana',
  nombre: 'Adriana Rodriguez Urrea',
  firma: Buffer.from('png'),
};

describe('CertificadosService', () => {
  let service: CertificadosService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let pdfMock: ReturnType<typeof createPdfMock>;
  let firmanteMock: { paraFirmar: jest.Mock };
  let auditoriaMock: { registrar: jest.Mock };

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    pdfMock = createPdfMock();
    firmanteMock = { paraFirmar: jest.fn().mockResolvedValue(FIRMANTE) };
    auditoriaMock = { registrar: jest.fn() };

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
        { provide: FirmanteService, useValue: firmanteMock },
        { provide: AuditoriaService, useValue: auditoriaMock },
      ],
    }).compile();

    service = module.get<CertificadosService>(CertificadosService);
  });

  it('genera certificado oleina con punto_nube y guarda parámetros', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    pdfMock.generateCertificadoAnalisisPdf.mockResolvedValue(
      '/static/certificados/cert-cert-1.pdf',
    );

    const response = await service.createAnalisis(
      {
        empresa_id: EMPRESA_A,
        tipo: CertificadoTipoDto.oleina,
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

    expect(pdfMock.generateCertificadoAnalisisPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        certificadoId: response.id,
        firmado_por: FIRMANTE.nombre,
        firma_img: FIRMANTE.firma,
      }),
    );
    expect(prismaMock.certificadoAnalisis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: response.id,
        empresa_id: EMPRESA_A,
        firmado_por: FIRMANTE.nombre,
        firmante_id: FIRMANTE.id,
        emitido_por: empleado.id,
        parametros: {
          create: expect.arrayContaining([
            { nombre: 'Punto de Nube (°C)', valor: '5,9', orden: 5 },
          ]) as unknown,
        },
      }) as unknown,
    });
    expect(response.archivo_url).toBe(`/api/certificados/${response.id}/pdf`);
  });

  it('no guarda nada si no hay firmante configurada', async () => {
    firmanteMock.paraFirmar.mockRejectedValue(
      new BadRequestException('No hay firmante'),
    );

    await expect(service.createAnalisis(rbdInput(), empleado)).rejects.toThrow(
      BadRequestException,
    );
    expect(pdfMock.generateCertificadoAnalisisPdf).not.toHaveBeenCalled();
    expect(prismaMock.certificadoAnalisis.create).not.toHaveBeenCalled();
  });

  it('no guarda el certificado si falla el PDF', async () => {
    pdfMock.generateCertificadoAnalisisPdf.mockRejectedValue(
      new Error('Falta el logo'),
    );

    await expect(service.createAnalisis(rbdInput(), empleado)).rejects.toThrow(
      'Falta el logo',
    );
    expect(prismaMock.certificadoAnalisis.create).not.toHaveBeenCalled();
  });

  describe('reemitir', () => {
    const ANULADO = '44444444-4444-4444-4444-444444444444';
    const anterior = (overrides: Record<string, unknown> = {}) => ({
      id: ANULADO,
      empresa_id: EMPRESA_A,
      anulado_at: new Date(),
      reemplazado_por: null,
      parametros: [],
      ...overrides,
    });

    it('enlaza el nuevo certificado con el anulado', async () => {
      prismaMock.certificadoAnalisis.findUnique.mockResolvedValue(anterior());

      await service.createAnalisis(
        rbdInput({ reemplaza_id: ANULADO }),
        empleado,
      );

      expect(prismaMock.certificadoAnalisis.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ reemplaza_id: ANULADO }) as unknown,
      });
    });

    it.each([
      ['no anulado', { anulado_at: null }],
      ['ya reemitido', { reemplazado_por: { id: 'otro' } }],
      ['de otra empresa', { empresa_id: EMPRESA_B }],
    ])('rechaza reemitir un certificado %s', async (_caso, overrides) => {
      prismaMock.certificadoAnalisis.findUnique.mockResolvedValue(
        anterior(overrides),
      );
      // Access to EMPRESA_B too, so only the reemisión rule can fail
      prismaMock.userEmpresa.findMany.mockResolvedValue([
        { empresa_id: EMPRESA_A },
        { empresa_id: EMPRESA_B },
      ]);

      await expect(
        service.createAnalisis(rbdInput({ reemplaza_id: ANULADO }), empleado),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.certificadoAnalisis.create).not.toHaveBeenCalled();
    });
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
        } as CreateCertificadoDto,
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
        } as CreateCertificadoDto,
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
        } as CreateCertificadoDto,
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

    it('combines the filters with the empresa restriction', async () => {
      prismaMock.certificadoAnalisis.findMany.mockResolvedValue([]);

      await service.findAllForUser(empleado, {
        tipo: 'rbd',
        busqueda: ' yoko ',
        fechaDesde: '2026-04-01',
        fechaHasta: '2026-04-30',
      });

      expect(prismaMock.certificadoAnalisis.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            empresa_id: { in: [EMPRESA_A] },
            tipo: 'rbd',
            fecha_emision: {
              gte: new Date('2026-04-01'),
              lt: new Date('2026-05-01'),
            },
            OR: [
              { empresa_cliente: { contains: 'yoko', mode: 'insensitive' } },
              { nit_cliente: { contains: 'yoko', mode: 'insensitive' } },
              { lote: { contains: 'yoko', mode: 'insensitive' } },
            ],
          },
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
