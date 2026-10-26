import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { limpiarNombre, normalizarBusqueda } from './texto';

const CIUDADES_POR_DEFECTO = 20;
const CIUDADES_MAX = 50;

export type ProductoInput = { nombre: string; descripcion?: string | null };
export type TipoEmpaqueInput = {
  nombre: string;
  capacidad?: number | null;
  unidad?: string | null;
  retornable?: boolean;
};

const productoInclude = {
  empaques: {
    where: { deleted_at: null, tipo_empaque: { deleted_at: null } },
    include: { tipo_empaque: true },
    orderBy: { tipo_empaque: { nombre: 'asc' } },
  },
} satisfies Prisma.ProductoInclude;

type ProductoRow = Prisma.ProductoGetPayload<{
  include: typeof productoInclude;
}>;
type TipoEmpaqueRow = Prisma.TipoEmpaqueGetPayload<object>;

function toTipoEmpaque(empaque: TipoEmpaqueRow) {
  return { ...empaque, capacidad: empaque.capacidad?.toNumber() ?? null };
}

function toProducto({ empaques, ...producto }: ProductoRow) {
  return {
    ...producto,
    empaques: empaques.map((link) => toTipoEmpaque(link.tipo_empaque)),
  };
}

/**
 * Catalogs (IG-35, IG-26). Names are unique, including deleted rows: creating
 * a name that was deleted restores that row instead of failing.
 */
@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Ciudades ─────────────────────────────────────────────────────────────

  // Matches anywhere in the name, ignoring accents; names starting with the
  // text come first ("soa" → Soacha).
  async ciudades(search?: string, first?: number) {
    const limit = Math.min(first ?? CIUDADES_POR_DEFECTO, CIUDADES_MAX);
    const texto = normalizarBusqueda(search ?? '');
    if (!texto) {
      return this.prisma.ciudad.findMany({
        orderBy: { nombre: 'asc' },
        take: limit,
      });
    }
    const [empiezan, contienen] = await Promise.all([
      this.prisma.ciudad.findMany({
        where: { nombre_busqueda: { startsWith: texto } },
        orderBy: { nombre: 'asc' },
        take: limit,
      }),
      this.prisma.ciudad.findMany({
        where: {
          nombre_busqueda: { contains: texto },
          NOT: { nombre_busqueda: { startsWith: texto } },
        },
        orderBy: { nombre: 'asc' },
        take: limit,
      }),
    ]);
    return [...empiezan, ...contienen].slice(0, limit);
  }

  async assertCiudad(id: string) {
    const ciudad = await this.prisma.ciudad.findUnique({ where: { id } });
    if (!ciudad) throw new BadRequestException('Ciudad no encontrada');
  }

  // ── Actividades económicas ───────────────────────────────────────────────

  actividades() {
    return this.prisma.actividadEconomica.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async createActividad(nombre: string) {
    const limpio = this.nombreValido(nombre);
    const existente = await this.prisma.actividadEconomica.findUnique({
      where: { nombre: limpio, deleted_at: undefined },
    });
    if (existente && !existente.deleted_at) {
      throw new ConflictException('Ya existe una actividad con ese nombre');
    }
    return existente
      ? this.prisma.actividadEconomica.update({
          where: { id: existente.id },
          data: { deleted_at: null },
        })
      : this.prisma.actividadEconomica.create({ data: { nombre: limpio } });
  }

  async updateActividad(id: string, nombre: string) {
    await this.findOr404(
      this.prisma.actividadEconomica.findUnique({ where: { id } }),
    );
    const limpio = this.nombreValido(nombre);
    await this.assertNombreLibre(
      this.prisma.actividadEconomica.findUnique({
        where: { nombre: limpio, deleted_at: undefined },
      }),
      id,
    );
    return this.prisma.actividadEconomica.update({
      where: { id },
      data: { nombre: limpio },
    });
  }

  async deleteActividad(id: string) {
    await this.findOr404(
      this.prisma.actividadEconomica.findUnique({ where: { id } }),
    );
    await this.prisma.actividadEconomica.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async assertActividad(id: string) {
    const actividad = await this.prisma.actividadEconomica.findUnique({
      where: { id },
    });
    if (!actividad) {
      throw new BadRequestException('Actividad económica no encontrada');
    }
  }

  // ── Productos ────────────────────────────────────────────────────────────

  async productos() {
    const rows = await this.prisma.producto.findMany({
      include: productoInclude,
      orderBy: { nombre: 'asc' },
    });
    return rows.map(toProducto);
  }

  async createProducto(input: ProductoInput) {
    const nombre = this.nombreValido(input.nombre);
    const existente = await this.prisma.producto.findUnique({
      where: { nombre, deleted_at: undefined },
    });
    if (existente && !existente.deleted_at) {
      throw new ConflictException('Ya existe un producto con ese nombre');
    }
    const data = { nombre, descripcion: input.descripcion ?? null };
    const producto = existente
      ? await this.prisma.producto.update({
          where: { id: existente.id },
          data: { ...data, deleted_at: null },
        })
      : await this.prisma.producto.create({ data });
    return this.producto(producto.id);
  }

  async updateProducto(id: string, input: Partial<ProductoInput>) {
    await this.findOr404(this.prisma.producto.findUnique({ where: { id } }));
    const nombre =
      input.nombre !== undefined ? this.nombreValido(input.nombre) : undefined;
    if (nombre) {
      await this.assertNombreLibre(
        this.prisma.producto.findUnique({
          where: { nombre, deleted_at: undefined },
        }),
        id,
      );
    }
    await this.prisma.producto.update({
      where: { id },
      data: { nombre, descripcion: input.descripcion },
    });
    return this.producto(id);
  }

  async deleteProducto(id: string) {
    await this.findOr404(this.prisma.producto.findUnique({ where: { id } }));
    await this.prisma.producto.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // Replaces the empaques this producto can be delivered in.
  async setEmpaquesProducto(productoId: string, tipoEmpaqueIds: string[]) {
    await this.findOr404(
      this.prisma.producto.findUnique({ where: { id: productoId } }),
    );
    const ids = [...new Set(tipoEmpaqueIds)];
    const encontrados = await this.prisma.tipoEmpaque.count({
      where: { id: { in: ids } },
    });
    if (encontrados !== ids.length) {
      throw new BadRequestException('Tipo de empaque no encontrado');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.productoEmpaque.updateMany({
        where: {
          producto_id: productoId,
          tipo_empaque_id: { notIn: ids },
          deleted_at: null,
        },
        data: { deleted_at: new Date() },
      });
      for (const tipo_empaque_id of ids) {
        await tx.productoEmpaque.upsert({
          where: {
            producto_id_tipo_empaque_id: {
              producto_id: productoId,
              tipo_empaque_id,
            },
          },
          create: { producto_id: productoId, tipo_empaque_id },
          update: { deleted_at: null },
        });
      }
    });
    return this.producto(productoId);
  }

  // ── Tipos de empaque ─────────────────────────────────────────────────────

  async tiposEmpaque() {
    const rows = await this.prisma.tipoEmpaque.findMany({
      orderBy: { nombre: 'asc' },
    });
    return rows.map(toTipoEmpaque);
  }

  async createTipoEmpaque(input: TipoEmpaqueInput) {
    const nombre = this.nombreValido(input.nombre);
    const existente = await this.prisma.tipoEmpaque.findUnique({
      where: { nombre, deleted_at: undefined },
    });
    if (existente && !existente.deleted_at) {
      throw new ConflictException('Ya existe un empaque con ese nombre');
    }
    const data = {
      nombre,
      capacidad: input.capacidad ?? null,
      unidad: input.unidad ?? null,
      retornable: input.retornable ?? false,
    };
    const empaque = existente
      ? await this.prisma.tipoEmpaque.update({
          where: { id: existente.id },
          data: { ...data, deleted_at: null },
        })
      : await this.prisma.tipoEmpaque.create({ data });
    return toTipoEmpaque(empaque);
  }

  async updateTipoEmpaque(id: string, input: Partial<TipoEmpaqueInput>) {
    await this.findOr404(this.prisma.tipoEmpaque.findUnique({ where: { id } }));
    const nombre =
      input.nombre !== undefined ? this.nombreValido(input.nombre) : undefined;
    if (nombre) {
      await this.assertNombreLibre(
        this.prisma.tipoEmpaque.findUnique({
          where: { nombre, deleted_at: undefined },
        }),
        id,
      );
    }
    const empaque = await this.prisma.tipoEmpaque.update({
      where: { id },
      data: {
        nombre,
        capacidad: input.capacidad,
        unidad: input.unidad,
        retornable: input.retornable ?? undefined,
      },
    });
    return toTipoEmpaque(empaque);
  }

  async deleteTipoEmpaque(id: string) {
    await this.findOr404(this.prisma.tipoEmpaque.findUnique({ where: { id } }));
    await this.prisma.tipoEmpaque.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async producto(id: string) {
    return toProducto(
      await this.prisma.producto.findUniqueOrThrow({
        where: { id },
        include: productoInclude,
      }),
    );
  }

  private nombreValido(nombre: string) {
    const limpio = limpiarNombre(nombre);
    if (!limpio) throw new BadRequestException('El nombre es obligatorio');
    return limpio;
  }

  private async findOr404<T>(query: Promise<T | null>) {
    const row = await query;
    if (!row) throw new NotFoundException('Registro no encontrado');
    return row;
  }

  private async assertNombreLibre(
    query: Promise<{ id: string } | null>,
    id: string,
  ) {
    const otro = await query;
    if (otro && otro.id !== id) {
      throw new ConflictException('Ya existe un registro con ese nombre');
    }
  }
}
