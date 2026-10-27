import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Rol, TipoEmpresa, TipoMovimiento } from '@prisma/client';
import { existsSync } from 'fs';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { paginate, PaginationArgs } from '../common/pagination';
import {
  accessibleEmpresaIds,
  assertEmpresaAccess,
} from '../empresas/empresa-access';
import { puede } from '../auth/roles';
import { CreateMovimientoInput, MovimientoLineaInput } from '../graphql/inputs';
import { MovimientoPdfService } from '../utils/pdf/movimiento-pdf.service';
import { movimientosDir } from '../utils/pdf/movimientos-dir';
import {
  MovimientoSnapshot,
  SnapshotEmpresa,
  UNIDADES_MEDIDA,
  numeroFormateado,
} from './movimiento.types';
import { TextosService } from './textos.service';

type Actor = { id: string; rol?: string };

export type FiltrosMovimientos = {
  empresaId?: string;
  clienteId?: string;
  tipo?: TipoMovimiento;
  productoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
};

export const movimientoInclude = {
  lineas: {
    where: { deleted_at: null },
    orderBy: { orden: 'asc' },
    include: { producto: true, tipo_empaque: true },
  },
  usuario_entrega: { select: { id: true, nombre: true } },
  anulador: { select: { nombre: true } },
} satisfies Prisma.MovimientoInclude;

export type MovimientoRow = Prisma.MovimientoGetPayload<{
  include: typeof movimientoInclude;
}>;

type LineaNormalizada = {
  orden: number;
  producto_id: string | null;
  unidad_medida: string | null;
  cantidad: number | null;
  tipo_empaque_id: string;
  cantidad_envases: number;
  vacios_recibidos: number;
  vacios_entregados: number;
};

const MOTIVO_MIN_LENGTH = 5;

const entrega = (tipo: TipoMovimiento) => tipo !== TipoMovimiento.RECOLECCION;
const recoleccion = (tipo: TipoMovimiento) => tipo !== TipoMovimiento.ENTREGA;

// Today in Colombia as YYYY-MM-DD
export function hoyEnBogota(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
  }).format(ahora);
}

export function fechaISO(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

function parseCantidad(valor: string) {
  const texto = valor.trim();
  if (!/^\d+([.,]\d+)?$/.test(texto)) {
    throw new BadRequestException(`Cantidad inválida: "${valor}"`);
  }
  return Number(texto.replace(',', '.'));
}

export function toMovimiento(row: MovimientoRow) {
  const { lineas, anulador, ...rest } = row;
  const snapshot = row.snapshot as unknown as MovimientoSnapshot;
  const lineasOut = lineas.map((linea) => ({
    ...linea,
    cantidad: linea.cantidad?.toNumber() ?? null,
  }));
  return {
    ...rest,
    fecha: fechaISO(row.fecha),
    numero_formateado: numeroFormateado(row.numero, row.anio),
    snapshot,
    lineas: lineasOut,
    total_kg: lineasOut.reduce(
      (total, l) => total + (l.unidad_medida === 'kg' ? (l.cantidad ?? 0) : 0),
      0,
    ),
    anulado: row.anulado_at !== null,
    anulado_por_nombre: anulador?.nombre ?? null,
    migrado: snapshot.migrado_de_pedido === true,
    archivo_url: `/api/movimientos/${row.id}/pdf`,
  };
}

/**
 * Entregas y recolecciones (IG-39, IG-27). Each one gets a number per
 * empresa and year, a snapshot for its certificado (IG-28) and, for
 * returnable envases, entries in the inventory ledger (IG-31).
 */
@Injectable()
export class MovimientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly pdf: MovimientoPdfService,
    private readonly textos: TextosService,
  ) {}

  async create(actor: Actor, input: CreateMovimientoInput) {
    await assertEmpresaAccess(this.prisma, actor, input.empresa_id);
    if (input.fecha.slice(0, 10) > hoyEnBogota()) {
      throw new BadRequestException('La fecha no puede ser futura');
    }
    const fecha = new Date(input.fecha.slice(0, 10));
    const conductor = await this.conductor(actor, input);
    const lineas = await this.normalizarLineas(input.tipo, input.lineas);
    const snapshot = await this.snapshot(input, conductor);
    const anio = fecha.getUTCFullYear();

    const id = await this.prisma.$transaction(
      async (tx) => {
        // Atomic: concurrent emissions wait for each other on this row
        const [{ ultimo }] = await tx.$queryRaw<{ ultimo: number }[]>`
          INSERT INTO "secuencias_movimiento" ("empresa_id", "anio", "ultimo")
          VALUES (${input.empresa_id}, ${anio}, 1)
          ON CONFLICT ("empresa_id", "anio")
          DO UPDATE SET "ultimo" = "secuencias_movimiento"."ultimo" + 1
          RETURNING "ultimo"`;

        const movimiento = await tx.movimiento.create({
          data: {
            empresa_id: input.empresa_id,
            numero: ultimo,
            anio,
            tipo: input.tipo,
            fecha,
            cliente_id: input.cliente_id,
            sede_id: input.sede_id,
            contacto_id: input.contacto_id ?? null,
            usuario_entrega_id: conductor.id,
            vehiculo_id: input.vehiculo_id ?? null,
            transportador_id: input.transportador_id ?? null,
            destino_id: input.destino_id ?? null,
            observacion: input.observacion?.trim() || null,
            snapshot: snapshot,
            firma_entrega: conductor.firma,
            firma_entrega_mime: conductor.firma_mime,
            creado_por: actor.id,
            lineas: { create: lineas },
          },
          include: movimientoInclude,
        });

        const inventario = await this.asientosInventario(lineas);
        if (inventario.length) {
          await tx.inventarioEnvase.createMany({
            data: inventario.map(({ tipo_empaque_id, cantidad }) => ({
              empresa_id: input.empresa_id,
              cliente_id: input.cliente_id,
              tipo_empaque_id,
              cantidad,
              movimiento_id: movimiento.id,
              fecha,
            })),
          });
        }

        // If the PDF fails, nothing is saved (the number is not used either)
        const archivo = await this.pdf.generar(this.pdfInput(movimiento));
        await tx.movimiento.update({
          where: { id: movimiento.id },
          data: { archivo_url: archivo },
        });
        return movimiento.id;
      },
      { timeout: 20_000 },
    );
    return this.findOne(actor, id);
  }

  async list(
    actor: Actor,
    filtros: FiltrosMovimientos = {},
    pagination?: PaginationArgs,
  ) {
    const where = await this.whereAccesible(actor, filtros);
    return paginate(
      pagination,
      async (page) =>
        (
          await this.prisma.movimiento.findMany({
            where,
            include: movimientoInclude,
            orderBy: [
              { fecha: 'desc' },
              { anio: 'desc' },
              { numero: 'desc' },
              { id: 'desc' },
            ],
            ...page,
          })
        ).map(toMovimiento),
      () => this.prisma.movimiento.count({ where }),
    );
  }

  async findOne(actor: Actor, id: string) {
    return toMovimiento(await this.findAccessible(actor, id));
  }

  // Super admin only (guard). The row, its number and its PDF are kept; the
  // PDF is regenerated with the ANULADO mark and it stops counting in the
  // inventory (IG-30).
  async anular(actor: Actor, id: string, motivo: string) {
    const movimiento = await this.findAccessible(actor, id);
    if (movimiento.anulado_at) {
      throw new BadRequestException('El movimiento ya está anulado');
    }
    const motivoLimpio = motivo.trim();
    if (motivoLimpio.length < MOTIVO_MIN_LENGTH) {
      throw new BadRequestException(
        `Indica el motivo de la anulación (mínimo ${MOTIVO_MIN_LENGTH} caracteres)`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      const anulado = await tx.movimiento.update({
        where: { id },
        data: {
          anulado_at: new Date(),
          anulado_por: actor.id,
          motivo_anulacion: motivoLimpio,
        },
        include: movimientoInclude,
      });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'movimiento.anular',
          entidad: 'movimiento',
          entidadId: id,
          detalle: {
            numero: numeroFormateado(anulado.numero, anulado.anio),
            motivo: motivoLimpio,
          },
        },
        tx,
      );
      const archivo = await this.pdf.generar(this.pdfInput(anulado));
      await tx.movimiento.update({
        where: { id },
        data: { archivo_url: archivo },
      });
    });
    return this.findOne(actor, id);
  }

  // Who can sign as conductor in the empresa: every entrega user for roles
  // that choose the conductor, otherwise only the actor.
  async conductores(actor: Actor, empresaId: string) {
    await assertEmpresaAccess(this.prisma, actor, empresaId);
    const todos = puede(actor.rol, 'movimientos', 'elegirConductor');
    return this.prisma.user
      .findMany({
        where: {
          rol: Rol.entrega,
          ...(todos ? {} : { id: actor.id }),
          empresas: { some: { empresa_id: empresaId, deleted_at: null } },
        },
        select: {
          id: true,
          nombre: true,
          vehiculo_por_defecto_id: true,
          firma_mime: true,
        },
        orderBy: { nombre: 'asc' },
      })
      .then((users) =>
        users.map(({ firma_mime, ...user }) => ({
          ...user,
          tiene_firma: firma_mime !== null,
        })),
      );
  }

  // Path of the PDF; generated on demand for movimientos migrated from pedidos.
  async getPdfPath(actor: Actor, id: string) {
    const movimiento = await this.findAccessible(actor, id);
    let archivo = movimiento.archivo_url;
    if (!archivo || !existsSync(path.join(movimientosDir(), archivo))) {
      archivo = await this.pdf.generar(this.pdfInput(movimiento));
      await this.prisma.movimiento.update({
        where: { id },
        data: { archivo_url: archivo },
      });
    }
    return {
      ruta: path.join(movimientosDir(), path.basename(archivo)),
      nombre: `certificado-${numeroFormateado(movimiento.numero, movimiento.anio)}.pdf`,
    };
  }

  // Where for the movimientos the actor can see: their empresas and, for
  // roles without `verTodos` (entrega), only the ones they delivered.
  async whereAccesible(
    actor: Actor,
    filtros: FiltrosMovimientos,
  ): Promise<Prisma.MovimientoWhereInput> {
    const { empresaId, clienteId, tipo, productoId, fechaDesde, fechaHasta } =
      filtros;
    if (empresaId) await assertEmpresaAccess(this.prisma, actor, empresaId);
    const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
    return {
      ...(empresaId
        ? { empresa_id: empresaId }
        : empresaIds
          ? { empresa_id: { in: empresaIds } }
          : {}),
      ...(puede(actor.rol, 'movimientos', 'verTodos')
        ? {}
        : { usuario_entrega_id: actor.id }),
      ...(clienteId ? { cliente_id: clienteId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(productoId
        ? { lineas: { some: { producto_id: productoId, deleted_at: null } } }
        : {}),
      ...(fechaDesde || fechaHasta
        ? {
            fecha: {
              ...(fechaDesde ? { gte: new Date(fechaDesde.slice(0, 10)) } : {}),
              ...(fechaHasta ? { lte: new Date(fechaHasta.slice(0, 10)) } : {}),
            },
          }
        : {}),
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Not found (instead of forbidden) for other tenants and, for entrega,
  // for other conductors' movimientos.
  private async findAccessible(actor: Actor, id: string) {
    const where = await this.whereAccesible(actor, {});
    const movimiento = await this.prisma.movimiento.findFirst({
      where: { ...where, id },
      include: movimientoInclude,
    });
    if (!movimiento) throw new NotFoundException('Movimiento no encontrado');
    return movimiento;
  }

  // Entrega users issue in their own name; admin and super admin choose.
  private async conductor(actor: Actor, input: CreateMovimientoInput) {
    const id = input.usuario_entrega_id ?? actor.id;
    if (
      id !== actor.id &&
      !puede(actor.rol, 'movimientos', 'elegirConductor')
    ) {
      throw new ForbiddenException(
        'Solo puedes emitir movimientos a tu nombre',
      );
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.rol !== Rol.entrega) {
      throw new BadRequestException(
        'El conductor debe ser un usuario activo con rol entrega',
      );
    }
    await assertEmpresaAccess(this.prisma, user, input.empresa_id).catch(() => {
      throw new BadRequestException(
        `${user.nombre} no está asignado a esta empresa`,
      );
    });
    if (!user.firma || !user.firma_mime) {
      throw new BadRequestException(
        `${user.nombre} no tiene imagen de firma. Súbela en Usuarios.`,
      );
    }
    return {
      id: user.id,
      nombre: user.nombre,
      documento: user.documento,
      firma: Buffer.from(user.firma),
      firma_mime: user.firma_mime,
    };
  }

  private async normalizarLineas(
    tipo: TipoMovimiento,
    lineas: MovimientoLineaInput[],
  ): Promise<LineaNormalizada[]> {
    if (lineas.length === 0) {
      throw new BadRequestException('Agrega al menos una línea al detalle');
    }
    const normalizadas = lineas.map((linea, i) => {
      const n = i + 1;
      const conProducto = !!linea.producto_id;
      if (conProducto && !entrega(tipo)) {
        throw new BadRequestException(
          `Línea ${n}: en una recolección no se registra producto entregado`,
        );
      }
      const cantidad = linea.cantidad?.trim()
        ? parseCantidad(linea.cantidad)
        : null;
      const unidad = linea.unidad_medida?.trim() || null;
      if (conProducto) {
        if (!cantidad || cantidad <= 0) {
          throw new BadRequestException(
            `Línea ${n}: indica la cantidad entregada`,
          );
        }
        if (
          !unidad ||
          !(UNIDADES_MEDIDA as readonly string[]).includes(unidad)
        ) {
          throw new BadRequestException(
            `Línea ${n}: la unidad debe ser ${UNIDADES_MEDIDA.join(', ')}`,
          );
        }
      } else if (cantidad !== null) {
        throw new BadRequestException(
          `Línea ${n}: elige el producto entregado`,
        );
      }
      const envases = linea.cantidad_envases ?? 0;
      const recibidos = linea.vacios_recibidos ?? 0;
      const entregados = linea.vacios_entregados ?? 0;
      if (envases > 0 && !entrega(tipo)) {
        throw new BadRequestException(
          `Línea ${n}: en una recolección no se entregan envases llenos`,
        );
      }
      if (!conProducto && recibidos === 0 && entregados === 0) {
        throw new BadRequestException(
          `Línea ${n}: no tiene nada para registrar`,
        );
      }
      return {
        orden: n,
        producto_id: linea.producto_id ?? null,
        unidad_medida: conProducto ? unidad : null,
        cantidad: conProducto ? cantidad : null,
        tipo_empaque_id: linea.tipo_empaque_id,
        cantidad_envases: envases,
        vacios_recibidos: recibidos,
        vacios_entregados: entregados,
      };
    });

    if (entrega(tipo) && !normalizadas.some((l) => l.producto_id)) {
      throw new BadRequestException('Indica el producto entregado');
    }
    if (
      recoleccion(tipo) &&
      !normalizadas.some((l) => l.vacios_recibidos > 0)
    ) {
      throw new BadRequestException('Indica los envases vacíos recogidos');
    }
    await this.validarCatalogo(normalizadas);
    return normalizadas;
  }

  // Active productos and empaques, and valid producto + empaque combinations
  private async validarCatalogo(lineas: LineaNormalizada[]) {
    const empaqueIds = [...new Set(lineas.map((l) => l.tipo_empaque_id))];
    const empaques = await this.prisma.tipoEmpaque.count({
      where: { id: { in: empaqueIds } },
    });
    if (empaques !== empaqueIds.length) {
      throw new BadRequestException('Tipo de envase no encontrado o inactivo');
    }
    for (const linea of lineas.filter((l) => l.producto_id)) {
      const combinacion = await this.prisma.productoEmpaque.findFirst({
        where: {
          producto_id: linea.producto_id!,
          tipo_empaque_id: linea.tipo_empaque_id,
          producto: { deleted_at: null },
        },
      });
      if (!combinacion) {
        throw new BadRequestException(
          `Línea ${linea.orden}: ese producto no se entrega en ese envase (o está inactivo)`,
        );
      }
    }
  }

  // + envases left at the cliente, - envases collected; only returnable ones
  private async asientosInventario(lineas: LineaNormalizada[]) {
    const retornables = new Set(
      (
        await this.prisma.tipoEmpaque.findMany({
          where: {
            id: { in: lineas.map((l) => l.tipo_empaque_id) },
            retornable: true,
            deleted_at: undefined,
          },
          select: { id: true },
        })
      ).map((e) => e.id),
    );
    const neto = new Map<string, number>();
    for (const l of lineas.filter((l) => retornables.has(l.tipo_empaque_id))) {
      const cantidad =
        l.cantidad_envases + l.vacios_entregados - l.vacios_recibidos;
      neto.set(
        l.tipo_empaque_id,
        (neto.get(l.tipo_empaque_id) ?? 0) + cantidad,
      );
    }
    return [...neto]
      .filter(([, cantidad]) => cantidad !== 0)
      .map(([tipo_empaque_id, cantidad]) => ({ tipo_empaque_id, cantidad }));
  }

  private async snapshot(
    input: CreateMovimientoInput,
    conductor: { nombre: string; documento: string | null },
  ): Promise<MovimientoSnapshot> {
    const cliente = await this.clienteDe(input.empresa_id, input.cliente_id);
    const sede = await this.prisma.sede.findUnique({
      where: { id: input.sede_id },
      include: { ciudad: true, actividad_economica: true },
    });
    if (!sede || sede.cliente_id !== cliente.id) {
      throw new BadRequestException('La sede no pertenece al cliente');
    }
    let contacto: MovimientoSnapshot['contacto'] = null;
    if (input.contacto_id) {
      const row = await this.prisma.contacto.findUnique({
        where: { id: input.contacto_id },
      });
      if (!row || row.cliente_id !== cliente.id) {
        throw new BadRequestException('El contacto no pertenece al cliente');
      }
      contacto = {
        nombre: row.nombre,
        cargo: row.cargo,
        documento: row.documento,
      };
    }
    let vehiculo: MovimientoSnapshot['vehiculo'] = null;
    if (input.vehiculo_id) {
      const row = await this.prisma.vehiculo.findUnique({
        where: { id: input.vehiculo_id },
      });
      if (!row || row.empresa_id !== input.empresa_id) {
        throw new BadRequestException('Vehículo no encontrado');
      }
      vehiculo = { placa: row.placa, descripcion: row.descripcion };
    }
    const transportador = input.transportador_id
      ? await this.empresaConTipo(
          input,
          input.transportador_id,
          TipoEmpresa.TRANSPORTADOR,
        )
      : null;
    const destino = input.destino_id
      ? await this.empresaConTipo(input, input.destino_id, TipoEmpresa.DESTINO)
      : null;

    const editado = input.sede_datos ?? {};
    const valor = (campo: keyof typeof editado, original: string | null) =>
      editado[campo] === undefined ? original : editado[campo]?.trim() || null;

    return {
      cliente: this.datosEmpresa(cliente),
      sede: {
        nombre: sede.nombre,
        actividad: valor('actividad', sede.actividad_economica?.nombre ?? null),
        direccion: valor('direccion', sede.direccion),
        telefono: valor('telefono', sede.telefono),
        barrio: valor('barrio', sede.barrio),
        localidad: valor('localidad', sede.localidad),
        email: valor('email', sede.email),
        ciudad: sede.ciudad?.nombre ?? null,
      },
      contacto,
      conductor: {
        nombre: conductor.nombre,
        documento: conductor.documento,
        cargo: 'Conductor',
      },
      vehiculo,
      transportador: transportador && this.datosEmpresa(transportador),
      destino: destino && this.datosEmpresa(destino),
      texto: await this.textos.texto(input.tipo),
    };
  }

  private async clienteDe(empresaId: string, clienteId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { ciudad: true },
    });
    if (!cliente || cliente.empresa_id !== empresaId) {
      throw new BadRequestException('El cliente no pertenece a la empresa');
    }
    return cliente;
  }

  private async empresaConTipo(
    input: CreateMovimientoInput,
    clienteId: string,
    tipo: TipoEmpresa,
  ) {
    const cliente = await this.clienteDe(input.empresa_id, clienteId);
    if (!cliente.tipos.includes(tipo)) {
      throw new BadRequestException(
        `${cliente.razon_social} no está marcado como ${tipo.toLowerCase()}`,
      );
    }
    return cliente;
  }

  private datosEmpresa(cliente: {
    razon_social: string;
    nit: string | null;
    dv: string | null;
    registro: string | null;
    ciudad: { nombre: string } | null;
  }): SnapshotEmpresa {
    return {
      razon_social: cliente.razon_social,
      nit: cliente.nit,
      dv: cliente.dv,
      registro: cliente.registro,
      ciudad: cliente.ciudad?.nombre ?? null,
    };
  }

  private pdfInput(row: MovimientoRow) {
    return {
      id: row.id,
      tipo: row.tipo,
      numero: numeroFormateado(row.numero, row.anio),
      fecha: fechaISO(row.fecha),
      snapshot: row.snapshot as unknown as MovimientoSnapshot,
      lineas: row.lineas.map((l) => ({
        producto: l.producto?.nombre ?? null,
        cantidad: l.cantidad?.toNumber() ?? null,
        unidad: l.unidad_medida,
        empaque: l.tipo_empaque.nombre,
        cantidad_envases: l.cantidad_envases,
        vacios_recibidos: l.vacios_recibidos,
        vacios_entregados: l.vacios_entregados,
      })),
      observacion: row.observacion,
      firma: row.firma_entrega ? Buffer.from(row.firma_entrega) : null,
      anulado: row.anulado_at !== null,
    };
  }
}
