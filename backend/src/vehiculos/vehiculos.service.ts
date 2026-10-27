import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoEmpresa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  accessibleEmpresaIds,
  assertEmpresaAccess,
} from '../empresas/empresa-access';
import { normalizarPlaca } from './placa';

type Actor = { id: string; rol?: string };

export type VehiculoInput = {
  empresa_id: string;
  transportador_id: string;
  placa: string;
  descripcion?: string | null;
};

const vehiculoInclude = {
  transportador: { select: { id: true, razon_social: true } },
} satisfies Prisma.VehiculoInclude;

/**
 * Vehicles of the transportadores (IG-40). The plate is unique per tenant,
 * deleted vehicles included: creating it again restores the old row.
 */
@Injectable()
export class VehiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(actor: Actor, empresaId?: string, transportadorId?: string) {
    if (empresaId) await assertEmpresaAccess(this.prisma, actor, empresaId);
    const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
    return this.prisma.vehiculo.findMany({
      where: {
        ...(empresaId
          ? { empresa_id: empresaId }
          : empresaIds
            ? { empresa_id: { in: empresaIds } }
            : {}),
        ...(transportadorId ? { transportador_id: transportadorId } : {}),
      },
      include: vehiculoInclude,
      orderBy: { placa: 'asc' },
    });
  }

  async create(actor: Actor, input: VehiculoInput) {
    await assertEmpresaAccess(this.prisma, actor, input.empresa_id);
    await this.assertTransportador(input.transportador_id, input.empresa_id);
    const placa = normalizarPlaca(input.placa);
    const existente = await this.prisma.vehiculo.findUnique({
      where: {
        empresa_id_placa: { empresa_id: input.empresa_id, placa },
        deleted_at: undefined,
      },
    });
    if (existente && !existente.deleted_at) {
      throw new ConflictException(`Ya existe un vehículo con placa ${placa}`);
    }
    const data = {
      transportador_id: input.transportador_id,
      descripcion: input.descripcion?.trim() || null,
    };
    return existente
      ? this.prisma.vehiculo.update({
          where: { id: existente.id },
          data: { ...data, deleted_at: null },
          include: vehiculoInclude,
        })
      : this.prisma.vehiculo.create({
          data: { ...data, empresa_id: input.empresa_id, placa },
          include: vehiculoInclude,
        });
  }

  async update(
    actor: Actor,
    id: string,
    input: Partial<Omit<VehiculoInput, 'empresa_id'>>,
  ) {
    const vehiculo = await this.findAccessible(actor, id);
    if (input.transportador_id) {
      await this.assertTransportador(
        input.transportador_id,
        vehiculo.empresa_id,
      );
    }
    let placa: string | undefined;
    if (input.placa) {
      placa = normalizarPlaca(input.placa);
      const otro = await this.prisma.vehiculo.findUnique({
        where: {
          empresa_id_placa: { empresa_id: vehiculo.empresa_id, placa },
          deleted_at: undefined,
        },
      });
      if (otro && otro.id !== id) {
        throw new ConflictException(`Ya existe un vehículo con placa ${placa}`);
      }
    }
    return this.prisma.vehiculo.update({
      where: { id },
      data: {
        placa,
        transportador_id: input.transportador_id ?? undefined,
        descripcion:
          input.descripcion === undefined
            ? undefined
            : input.descripcion?.trim() || null,
      },
      include: vehiculoInclude,
    });
  }

  async remove(actor: Actor, id: string) {
    await this.findAccessible(actor, id);
    await this.prisma.$transaction([
      // Drivers stop having it as their default vehicle
      this.prisma.user.updateMany({
        where: { vehiculo_por_defecto_id: id },
        data: { vehiculo_por_defecto_id: null },
      }),
      this.prisma.vehiculo.update({
        where: { id },
        data: { deleted_at: new Date() },
      }),
    ]);
  }

  // Default vehicle of a driver, preloaded in their movimientos.
  async asignarPorDefecto(
    actor: Actor,
    userId: string,
    vehiculoId: string | null,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (vehiculoId) await this.findAccessible(actor, vehiculoId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { vehiculo_por_defecto_id: vehiculoId },
    });
    return vehiculoId ? this.findAccessible(actor, vehiculoId) : null;
  }

  async findAccessible(actor: Actor, id: string) {
    const vehiculo = await this.prisma.vehiculo.findUnique({
      where: { id },
      include: vehiculoInclude,
    });
    const empresaIds = vehiculo
      ? await accessibleEmpresaIds(this.prisma, actor)
      : null;
    if (
      !vehiculo ||
      (empresaIds && !empresaIds.includes(vehiculo.empresa_id))
    ) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    return vehiculo;
  }

  private async assertTransportador(clienteId: string, empresaId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
    });
    if (
      !cliente ||
      cliente.empresa_id !== empresaId ||
      !cliente.tipos.includes(TipoEmpresa.TRANSPORTADOR)
    ) {
      throw new BadRequestException(
        'El transportador debe ser un cliente de la empresa con tipo Transportador',
      );
    }
  }
}
