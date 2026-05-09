import { BadRequestException, Injectable } from '@nestjs/common';
import { CertificadoTipo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CertificadoTipoDto,
  CreateCertificadoDto,
} from './dto/create-certificado.dto';
import { AnalisisPdfService } from '../utils/pdf/analisis-pdf.service';

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
  ) {}

  async createAnalisis(dto: CreateCertificadoDto) {
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
    const fechaEmision = new Date();
    const firmadoPor = 'ADRIANA RODRIGUEZ URREA';
    const certificado = await this.prisma.certificadoAnalisis.create({
      data: {
        tipo: dto.tipo as CertificadoTipo,
        empresa_cliente: dto.empresa_cliente,
        nit_cliente: dto.nit_cliente ?? null,
        lote: dto.lote,
        peso_kg: dto.tipo === CertificadoTipoDto.rbd ? dto.peso_kg ?? null : null,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        firmado_por: firmadoPor,
      },
    });

    await this.prisma.parametroAnalisis.createMany({
      data: parametros.map((param) => ({
        certificado_id: certificado.id,
        nombre: param.nombre,
        valor: param.valor,
        orden: param.orden,
      })),
    });

    const archivoUrl = await this.analisisPdfService.generateCertificadoAnalisisPdf(
      {
        certificadoId: certificado.id,
        tipo: dto.tipo as 'oleina' | 'rbd',
        empresa_cliente: dto.empresa_cliente,
        nit_cliente: dto.nit_cliente ?? null,
        lote: dto.lote,
        peso_kg: dto.tipo === CertificadoTipoDto.rbd ? dto.peso_kg ?? null : null,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        firmado_por: firmadoPor,
        parametros: parametros.map((param) => ({
          nombre: param.nombre,
          valor: param.valor,
        })),
      },
    );

    await this.prisma.certificadoAnalisis.update({
      where: { id: certificado.id },
      data: { archivo_url: archivoUrl },
    });

    return {
      id: certificado.id,
      archivo_url: archivoUrl,
      fecha_emision: this.formatoFechaISO(fechaEmision),
      mensaje: 'Certificado generado correctamente',
    };
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
