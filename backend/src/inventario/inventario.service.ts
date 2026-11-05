import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  accessibleEmpresaIds,
  assertEmpresaAccess,
} from '../empresas/empresa-access';
import { AjusteInventarioInput } from '../graphql/inputs';
import { hoyEnBogota } from '../movimientos/movimientos.service';
import { numeroFormateado } from '../movimientos/movimiento.types';

type Actor = { id: string; rol?: string };

// Entries that count: manual adjustments and movimientos not annulled
const VIGENTES: Prisma.InventarioEnvaseWhereInput = {
  OR: [
    { movimiento_id: null },
    { movimiento: { anulado_at: null, deleted_at: null } },
  ],
};

const HISTORIAL_LIMITE = 50;

/**
 * Returnable envases at each cliente (IG-31): a ledger where deliveries add
 * and collections subtract. Annulling a movimiento removes its effect.
 */
@Injectable()
export class InventarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // Balance per cliente and envase type (only non-zero ones)
  async saldos(actor: Actor, empresaId?: string, clienteId?: string) {
    const where = await this.whereAccesible(actor, empresaId, clienteId);
    const grupos = await this.prisma.inventarioEnvase.groupBy({
      by: ['cliente_id', 'tipo_empaque_id'],
      where,
      _sum: { cantidad: true },
    });
    const conSaldo = grupos.filter((g) => (g._sum.cantidad ?? 0) !== 0);
    const [clientes, empaques] = await Promise.all([
      this.prisma.cliente.findMany({
        where: {
          id: { in: conSaldo.map((g) => g.cliente_id) },
          deleted_at: undefined,
        },
        select: { id: true, razon_social: true, nit: true, dv: true },
      }),
      this.prisma.tipoEmpaque.findMany({
        where: {
          id: { in: conSaldo.map((g) => g.tipo_empaque_id) },
          deleted_at: undefined,
        },
        select: { id: true, nombre: true },
      }),
    ]);
    const cliente = new Map(clientes.map((c) => [c.id, c]));
    const empaque = new Map(empaques.map((e) => [e.id, e]));
    return conSaldo
      .map((g) => ({
        cliente: cliente.get(g.cliente_id)!,
        tipo_empaque: empaque.get(g.tipo_empaque_id)!,
        saldo: g._sum.cantidad ?? 0,
      }))
      .sort(
        (a, b) =>
          a.cliente.razon_social.localeCompare(b.cliente.razon_social, 'es') ||
          a.tipo_empaque.nombre.localeCompare(b.tipo_empaque.nombre, 'es'),
      );
  }

  // Latest entries of a cliente, with the movimiento that caused them
  async historial(actor: Actor, clienteId: string) {
    const where = await this.whereAccesible(actor, undefined, clienteId);
    const filas = await this.prisma.inventarioEnvase.findMany({
      where: { ...where, OR: undefined },
      include: {
        tipo_empaque: { select: { id: true, nombre: true } },
        movimiento: {
          select: {
            id: true,
            numero: true,
            anio: true,
            tipo: true,
            anulado_at: true,
          },
        },
        creador: { select: { nombre: true } },
      },
      orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
      take: HISTORIAL_LIMITE,
    });
    return filas.map((fila) => ({
      id: fila.id,
      fecha: fila.fecha.toISOString().slice(0, 10),
      tipo_empaque: fila.tipo_empaque,
      cantidad: fila.cantidad,
      motivo: fila.motivo,
      creado_por_nombre: fila.creador?.nombre ?? null,
      movimiento_id: fila.movimiento?.id ?? null,
      movimiento_numero: fila.movimiento
        ? numeroFormateado(fila.movimiento.numero, fila.movimiento.anio)
        : null,
      movimiento_tipo: fila.movimiento?.tipo ?? null,
      anulado: fila.movimiento?.anulado_at != null,
    }));
  }

  // Opening balance or correction, super admin only (guard)
  async ajustar(actor: Actor, input: AjusteInventarioInput) {
    if (input.cantidad === 0) {
      throw new BadRequestException('La cantidad del ajuste no puede ser 0');
    }
    const motivo = input.motivo.trim();
    if (motivo.length < 5) {
      throw new BadRequestException('Indica el motivo del ajuste');
    }
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: input.cliente_id },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    await assertEmpresaAccess(this.prisma, actor, cliente.empresa_id);
    const empaque = await this.prisma.tipoEmpaque.findUnique({
      where: { id: input.tipo_empaque_id },
    });
    if (!empaque?.retornable) {
      throw new BadRequestException(
        'Solo se ajustan envases retornables (galón, caneca…)',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      const ajuste = await tx.inventarioEnvase.create({
        data: {
          empresa_id: cliente.empresa_id,
          cliente_id: cliente.id,
          tipo_empaque_id: empaque.id,
          cantidad: input.cantidad,
          motivo,
          creado_por: actor.id,
          fecha: new Date(hoyEnBogota()),
        },
      });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'inventario.ajustar',
          entidad: 'inventario_envase',
          entidadId: ajuste.id,
          detalle: {
            cliente_id: cliente.id,
            tipo_empaque: empaque.nombre,
            cantidad: input.cantidad,
            motivo,
          },
        },
        tx,
      );
    });
    return this.saldos(actor, cliente.empresa_id, cliente.id);
  }

  private async whereAccesible(
    actor: Actor,
    empresaId?: string,
    clienteId?: string,
  ): Promise<Prisma.InventarioEnvaseWhereInput> {
    if (empresaId) await assertEmpresaAccess(this.prisma, actor, empresaId);
    const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
    return {
      ...VIGENTES,
      ...(empresaId
        ? { empresa_id: empresaId }
        : empresaIds
          ? { empresa_id: { in: empresaIds } }
          : {}),
      ...(clienteId ? { cliente_id: clienteId } : {}),
    };
  }
}
