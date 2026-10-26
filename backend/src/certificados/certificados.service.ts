import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CertificadoTipo, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { paginate, PaginationArgs } from '../common/pagination';
import {
  accessibleEmpresaIds,
  assertEmpresaAccess,
} from '../empresas/empresa-access';
import {
  CertificadoTipoDto,
  CreateCertificadoDto,
} from './dto/create-certificado.dto';
import { AnalisisPdfService } from '../utils/pdf/analisis-pdf.service';
import { certificadosDir } from '../utils/pdf/certificados-dir';
import { FirmanteService } from './firmante.service';

type Actor = { id: string; rol?: string };

export type FiltrosCertificados = {
  empresaId?: string;
  tipo?: CertificadoTipo;
  // Matches cliente, NIT or lote
  busqueda?: string;
  fechaDesde?: string;
  fechaHasta?: string;
};

const MOTIVO_MIN_LENGTH = 5;

const certificadoInclude = {
  parametros: { where: { deleted_at: null }, orderBy: { orden: 'asc' } },
  empresa: true,
  anulador: { select: { nombre: true } },
  reemplazado_por: { select: { id: true } },
} satisfies Prisma.CertificadoAnalisisInclude;

type CertificadoConParametros = Prisma.CertificadoAnalisisGetPayload<{
  include: typeof certificadoInclude;
}>;

type ParametroPersistencia = {
  nombre: string;
  valor: string;
  orden: number;
};

const PARAMETROS_OLEINA: Array<{ key: string; nombre: string }> = [
  { key: 'acidez', nombre: 'Acidez (%)' },
  { key: 'humedad', nombre: 'Humedad (%)' },
  { key: 'indice_yodo', nombre: 'Índice de Yodo (g I₂/100g)' },
  { key: 'peroxido', nombre: 'Peróxido (meq O₂ Kg)' },
  { key: 'punto_nube', nombre: 'Punto de Nube (°C)' },
  { key: 'color_amarillo', nombre: 'Color Celda 5¼" – Amarillo' },
  { key: 'color_rojo', nombre: 'Color Celda 5¼" – Rojo' },
];

const PARAMETROS_RBD: Array<{ key: string; nombre: string }> = [
  { key: 'acidez', nombre: 'Acidez (%)' },
  { key: 'humedad', nombre: 'Humedad (%)' },
  { key: 'indice_yodo', nombre: 'Índice de Yodo (g I₂/100g)' },
  { key: 'peroxido', nombre: 'Peróxido (meq O₂ Kg)' },
  { key: 'color_amarillo', nombre: 'Color Celda 5¼" – Amarillo' },
  { key: 'color_rojo', nombre: 'Color Celda 5¼" – Rojo' },
];

@Injectable()
export class CertificadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analisisPdfService: AnalisisPdfService,
    private readonly firmanteService: FirmanteService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async createAnalisis(dto: CreateCertificadoDto, actor: Actor) {
    await assertEmpresaAccess(this.prisma, actor, dto.empresa_id);
    if (dto.reemplaza_id) {
      await this.assertReemplazable(actor, dto.reemplaza_id, dto.empresa_id);
    }
    if (dto.cliente_id) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: dto.cliente_id },
      });
      if (!cliente || cliente.empresa_id !== dto.empresa_id) {
        throw new BadRequestException('El cliente no pertenece a la empresa');
      }
    }

    const fechaVencimiento = new Date(dto.fecha_vencimiento);
    if (Number.isNaN(fechaVencimiento.getTime())) {
      throw new BadRequestException('fecha_vencimiento no es una fecha válida');
    }
    if (fechaVencimiento <= new Date()) {
      throw new BadRequestException(
        'fecha_vencimiento debe ser una fecha futura',
      );
    }

    const parametros = this.normalizarParametros(dto.tipo, dto.parametros);
    const firmante = await this.firmanteService.paraFirmar();
    const id = randomUUID();
    const fechaEmision = new Date();
    const pesoKg =
      dto.tipo === CertificadoTipoDto.rbd ? (dto.peso_kg ?? null) : null;

    // The PDF is generated first: if it fails, nothing is saved.
    const archivoUrl =
      await this.analisisPdfService.generateCertificadoAnalisisPdf({
        certificadoId: id,
        tipo: dto.tipo,
        empresa_cliente: dto.empresa_cliente,
        nit_cliente: dto.nit_cliente ?? null,
        lote: dto.lote,
        peso_kg: pesoKg,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        firmado_por: firmante.nombre,
        firma_img: firmante.firma,
        parametros: parametros.map(({ nombre, valor }) => ({ nombre, valor })),
      });

    await this.prisma.certificadoAnalisis.create({
      data: {
        id,
        empresa_id: dto.empresa_id,
        cliente_id: dto.cliente_id ?? null,
        tipo: dto.tipo,
        empresa_cliente: dto.empresa_cliente,
        nit_cliente: dto.nit_cliente ?? null,
        lote: dto.lote,
        peso_kg: pesoKg,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        firmado_por: firmante.nombre,
        firmante_id: firmante.id,
        emitido_por: actor.id,
        reemplaza_id: dto.reemplaza_id ?? null,
        archivo_url: archivoUrl,
        parametros: { create: parametros },
      },
    });

    return {
      id,
      archivo_url: this.downloadPath(id),
      fecha_emision: this.formatoFechaISO(fechaEmision),
      mensaje: 'Certificado generado correctamente',
    };
  }

  // Marks it as not valid. The row and its PDF are kept (IG-22).
  async anular(actor: Actor, id: string, motivo: string) {
    const certificado = await this.findAccessible(actor, id);
    if (certificado.anulado_at) {
      throw new BadRequestException('El certificado ya está anulado');
    }
    const motivoLimpio = motivo.trim();
    if (motivoLimpio.length < MOTIVO_MIN_LENGTH) {
      throw new BadRequestException(
        `Indica el motivo de la anulación (mínimo ${MOTIVO_MIN_LENGTH} caracteres)`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.certificadoAnalisis.update({
        where: { id },
        data: {
          anulado_at: new Date(),
          anulado_por: actor.id,
          motivo_anulacion: motivoLimpio,
        },
      });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'certificado.anular',
          entidad: 'certificado',
          entidadId: id,
          detalle: { motivo: motivoLimpio },
        },
        tx,
      );
    });
    return this.findOneForUser(actor, id);
  }

  async findAllForUser(
    actor: Actor,
    filtros: FiltrosCertificados = {},
    pagination?: PaginationArgs,
  ) {
    const { empresaId, tipo, fechaDesde, fechaHasta } = filtros;
    if (empresaId) await assertEmpresaAccess(this.prisma, actor, empresaId);
    const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
    const busqueda = filtros.busqueda?.trim();

    const where: Prisma.CertificadoAnalisisWhereInput = {
      ...(empresaId
        ? { empresa_id: empresaId }
        : empresaIds
          ? { empresa_id: { in: empresaIds } }
          : {}),
      ...(tipo ? { tipo } : {}),
      ...(fechaDesde || fechaHasta
        ? {
            fecha_emision: {
              ...(fechaDesde ? { gte: this.inicioDelDia(fechaDesde) } : {}),
              ...(fechaHasta ? { lt: this.diaSiguiente(fechaHasta) } : {}),
            },
          }
        : {}),
      ...(busqueda
        ? {
            OR: (['empresa_cliente', 'nit_cliente', 'lote'] as const).map(
              (campo) => ({
                [campo]: { contains: busqueda, mode: 'insensitive' as const },
              }),
            ),
          }
        : {}),
    };

    return paginate(
      pagination,
      async (page) => {
        const certificados = await this.prisma.certificadoAnalisis.findMany({
          where,
          include: certificadoInclude,
          orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
          ...page,
        });
        return certificados.map((c) => this.serialize(c));
      },
      () => this.prisma.certificadoAnalisis.count({ where }),
    );
  }

  async findOneForUser(actor: Actor, id: string) {
    return this.serialize(await this.findAccessible(actor, id));
  }

  // Absolute path of the PDF, only if the actor can access the certificado.
  async getPdfPath(actor: Actor, id: string) {
    const certificado = await this.findAccessible(actor, id);
    if (!certificado.archivo_url) {
      throw new NotFoundException('El certificado no tiene PDF');
    }
    const filePath = path.join(
      certificadosDir(),
      path.basename(certificado.archivo_url),
    );
    if (!existsSync(filePath)) {
      throw new NotFoundException('Archivo PDF no encontrado');
    }
    return filePath;
  }

  // Not found (instead of forbidden) so other tenants' ids are not disclosed.
  private async findAccessible(actor: Actor, id: string) {
    const certificado = await this.prisma.certificadoAnalisis.findUnique({
      where: { id },
      include: certificadoInclude,
    });
    if (!certificado) throw new NotFoundException('Certificado no encontrado');

    const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
    if (
      empresaIds &&
      (!certificado.empresa_id || !empresaIds.includes(certificado.empresa_id))
    ) {
      throw new NotFoundException('Certificado no encontrado');
    }
    return certificado;
  }

  // An anulado certificado can be corrected once, in the same empresa.
  private async assertReemplazable(
    actor: Actor,
    reemplazaId: string,
    empresaId: string,
  ) {
    const anterior = await this.findAccessible(actor, reemplazaId);
    if (!anterior.anulado_at) {
      throw new BadRequestException(
        'Solo se puede reemitir un certificado anulado',
      );
    }
    if (anterior.reemplazado_por) {
      throw new BadRequestException('Ese certificado ya fue reemitido');
    }
    if (anterior.empresa_id !== empresaId) {
      throw new BadRequestException(
        'El certificado reemitido debe ser de la misma empresa',
      );
    }
  }

  private serialize(certificado: CertificadoConParametros) {
    const { anulador, reemplazado_por, ...rest } = certificado;
    const claves = new Map(
      [...PARAMETROS_OLEINA, ...PARAMETROS_RBD].map((p) => [p.nombre, p.key]),
    );
    return {
      ...rest,
      peso_kg: certificado.peso_kg?.toNumber() ?? null,
      archivo_url: certificado.archivo_url
        ? this.downloadPath(certificado.id)
        : null,
      anulado: certificado.anulado_at !== null,
      anulado_por_nombre: anulador?.nombre ?? null,
      reemplazado_por_id: reemplazado_por?.id ?? null,
      parametros: certificado.parametros.map(({ nombre, valor, orden }) => ({
        clave: claves.get(nombre) ?? null,
        nombre,
        valor,
        orden,
      })),
    };
  }

  // Dates come as YYYY-MM-DD (or ISO); the range is in UTC days.
  private inicioDelDia(fecha: string) {
    const date = new Date(fecha.slice(0, 10));
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }
    return date;
  }

  private diaSiguiente(fecha: string) {
    const date = this.inicioDelDia(fecha);
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }

  private downloadPath(id: string) {
    return `/api/certificados/${id}/pdf`;
  }

  private normalizarParametros(
    tipo: CertificadoTipoDto,
    parametros: Record<string, string>,
  ): ParametroPersistencia[] {
    const config =
      tipo === CertificadoTipoDto.oleina ? PARAMETROS_OLEINA : PARAMETROS_RBD;

    const normalized: ParametroPersistencia[] = config.map((entry, index) => {
      const valor = parametros?.[entry.key];
      if (typeof valor !== 'string' || valor.trim().length === 0) {
        throw new BadRequestException(
          `El parámetro ${entry.key} es obligatorio para ${tipo}`,
        );
      }
      if (!this.esNumeroValido(valor)) {
        throw new BadRequestException(
          `El parámetro ${entry.key} debe ser un valor numérico válido`,
        );
      }

      return {
        nombre: entry.nombre,
        valor: valor.trim(),
        orden: index + 1,
      };
    });

    return normalized;
  }

  private esNumeroValido(value: string) {
    return /^\d+(?:[.,]\d+)?$/.test(value.trim());
  }

  private formatoFechaISO(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
