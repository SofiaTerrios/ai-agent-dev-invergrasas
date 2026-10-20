import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  accessibleEmpresaIds,
  assertEmpresaAccess,
} from '../empresas/empresa-access';
import {
  emptyConnection,
  paginate,
  PaginationArgs,
} from '../common/pagination';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { FilterPedidoDto } from './dto/filter-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

type PedidoSerializado = Omit<
  Prisma.PedidoGetPayload<{ include: { cliente: true } }>,
  'cantidad_kg'
> & { cantidad_kg: number };

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePedidoDto, creado_por: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: data.empresa_id },
    });
    if (!empresa) throw new NotFoundException('Empresa not found');

    const cliente = await this.prisma.cliente.findUnique({
      where: { id: data.cliente_id },
    });
    if (!cliente) throw new NotFoundException('Cliente not found');

    const pedido = await this.prisma.pedido.create({
      data: {
        ...data,
        creado_por,
        fecha: new Date(data.fecha),
      },
      include: { cliente: true },
    });
    return this.serializePedido(pedido);
  }

  // Pedidos of the empresas the actor can access (admins: all), optionally
  // narrowed to one empresa with filters.empresa_id.
  async listForUser(
    actor: { id: string; rol?: string },
    filters: FilterPedidoDto,
    pagination?: PaginationArgs,
  ) {
    const where: Prisma.PedidoWhereInput = {};
    if (filters.empresa_id) {
      await assertEmpresaAccess(this.prisma, actor, filters.empresa_id);
      where.empresa_id = filters.empresa_id;
    } else {
      const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
      if (empresaIds?.length === 0) {
        return emptyConnection<PedidoSerializado>();
      }
      if (empresaIds) where.empresa_id = { in: empresaIds };
    }

    if (filters.cliente_id) where.cliente_id = filters.cliente_id;
    if (filters.producto) where.producto = filters.producto;

    if (filters.fecha_inicio || filters.fecha_fin) {
      where.fecha = {};
      if (filters.fecha_inicio)
        where.fecha.gte = new Date(filters.fecha_inicio);
      if (filters.fecha_fin) {
        const endOfDay = new Date(filters.fecha_fin);
        endOfDay.setHours(23, 59, 59, 999);
        where.fecha.lte = endOfDay;
      }
    }

    return paginate(
      pagination,
      async (page) => {
        const pedidos = await this.prisma.pedido.findMany({
          where,
          include: { cliente: true },
          orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
          ...page,
        });
        return pedidos.map((pedido) => this.serializePedido(pedido));
      },
      () => this.prisma.pedido.count({ where }),
    );
  }

  async update(
    id: string,
    data: UpdatePedidoDto,
    actor: { id: string; rol?: string },
  ) {
    const existing = await this.prisma.pedido.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido not found');

    if (actor.rol !== 'admin') {
      const link = await this.prisma.userEmpresa.findUnique({
        where: {
          user_id_empresa_id: {
            user_id: actor.id,
            empresa_id: existing.empresa_id,
          },
        },
      });
      if (!link) throw new ForbiddenException('Forbidden');
    }

    if (data.empresa_id && data.empresa_id !== existing.empresa_id) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: data.empresa_id },
      });
      if (!empresa) throw new NotFoundException('Empresa not found');
    }

    if (data.cliente_id && data.cliente_id !== existing.cliente_id) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: data.cliente_id },
      });
      if (!cliente) throw new NotFoundException('Cliente not found');
    }

    const payload = {
      ...data,
      ...(data.fecha ? { fecha: new Date(data.fecha) } : {}),
    };
    const updated = await this.prisma.pedido.update({
      where: { id },
      data: payload,
      include: { cliente: true },
    });
    return this.serializePedido(updated);
  }

  private serializePedido<T extends { cantidad_kg: Prisma.Decimal }>(
    pedido: T,
  ) {
    return {
      ...pedido,
      cantidad_kg: pedido.cantidad_kg.toNumber(),
    };
  }
}
