import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoEmpresa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationArgs } from '../common/pagination';
import {
  accessibleEmpresaIds,
  assertEmpresaAccess,
} from '../empresas/empresa-access';
import { CatalogosService } from '../catalogos/catalogos.service';
import { limpiarNombre } from '../catalogos/texto';
import {
  CreateClienteInput,
  CreateContactoInput,
  CreateSedeInput,
  SedeDatosInput,
  UpdateClienteInput,
  UpdateContactoInput,
  UpdateSedeInput,
} from '../graphql/inputs';
import { normalizarNit } from './nit';

type Actor = { id: string; rol?: string };
type Tx = Prisma.TransactionClient;

export type FiltrosClientes = {
  empresaId?: string;
  search?: string;
  tipo?: TipoEmpresa;
};

const sedeInclude = {
  ciudad: true,
  actividad_economica: true,
} satisfies Prisma.SedeInclude;

const clienteInclude = {
  ciudad: true,
  sedes: {
    where: { deleted_at: null },
    include: sedeInclude,
    orderBy: [{ principal: 'desc' }, { nombre: 'asc' }],
  },
  contactos: { where: { deleted_at: null }, orderBy: { nombre: 'asc' } },
} satisfies Prisma.ClienteInclude;

type ClienteRow = Prisma.ClienteGetPayload<{ include: typeof clienteInclude }>;
type SedeRow = Prisma.SedeGetPayload<{ include: typeof sedeInclude }>;

function toSede(sede: SedeRow) {
  return { ...sede, activa: sede.deleted_at === null };
}

function toCliente(cliente: ClienteRow) {
  const principal = cliente.sedes.find((sede) => sede.principal);
  return {
    ...cliente,
    datos_incompletos:
      !cliente.nit || !cliente.ciudad_id || !principal?.direccion,
    sedes: cliente.sedes.map(toSede),
  };
}

// Optional text fields: empty strings are stored as null
const opcional = (valor?: string | null) =>
  valor === undefined ? undefined : valor?.trim() || null;

/**
 * Empresas cliente (IG-36) with their sedes (IG-37) and contactos (IG-38).
 * Every operation is limited to the empresas (tenants) of the actor.
 */
@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogos: CatalogosService,
  ) {}

  // ── Clientes ─────────────────────────────────────────────────────────────

  async list(
    actor: Actor,
    filtros: FiltrosClientes = {},
    pagination?: PaginationArgs,
  ) {
    const { empresaId, tipo } = filtros;
    if (empresaId) await assertEmpresaAccess(this.prisma, actor, empresaId);
    const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
    const search = filtros.search?.trim();
    const digitos = search?.replace(/[.\s-]/g, '');

    const where: Prisma.ClienteWhereInput = {
      ...(empresaId
        ? { empresa_id: empresaId }
        : empresaIds
          ? { empresa_id: { in: empresaIds } }
          : {}),
      ...(tipo ? { tipos: { has: tipo } } : {}),
      ...(search
        ? {
            OR: [
              { razon_social: { contains: search, mode: 'insensitive' } },
              ...(digitos && /^\d+$/.test(digitos)
                ? [{ nit: { startsWith: digitos } }]
                : []),
            ],
          }
        : {}),
    };

    return paginate(
      pagination,
      async (page) =>
        (
          await this.prisma.cliente.findMany({
            where,
            include: clienteInclude,
            orderBy: [{ razon_social: 'asc' }, { id: 'asc' }],
            ...page,
          })
        ).map(toCliente),
      () => this.prisma.cliente.count({ where }),
    );
  }

  async findOne(actor: Actor, id: string) {
    return toCliente(await this.findAccessible(actor, id));
  }

  // Creates the cliente with its first (principal) sede in one step.
  async create(actor: Actor, input: CreateClienteInput) {
    await assertEmpresaAccess(this.prisma, actor, input.empresa_id);
    const { nit, dv } = normalizarNit(input.nit);
    await this.assertNitLibre(input.empresa_id, nit);
    await this.catalogos.assertCiudad(input.ciudad_id);
    await this.validarSede(input.sede_principal);

    const cliente = await this.prisma.cliente.create({
      data: {
        empresa_id: input.empresa_id,
        razon_social: limpiarNombre(input.razon_social),
        nit,
        dv,
        registro: opcional(input.registro),
        ciudad_id: input.ciudad_id,
        tipos: this.tiposValidos(input.tipos),
        sedes: {
          create: { ...this.datosSede(input.sede_principal), principal: true },
        },
      },
    });
    return this.findOne(actor, cliente.id);
  }

  async update(actor: Actor, id: string, input: UpdateClienteInput) {
    const existing = await this.findAccessible(actor, id);
    let nit: { nit: string; dv: string } | undefined;
    if (input.nit) {
      nit = normalizarNit(input.nit);
      if (nit.nit !== existing.nit) {
        await this.assertNitLibre(existing.empresa_id, nit.nit);
      }
    }
    if (input.ciudad_id) await this.catalogos.assertCiudad(input.ciudad_id);

    await this.prisma.cliente.update({
      where: { id },
      data: {
        razon_social: input.razon_social
          ? limpiarNombre(input.razon_social)
          : undefined,
        ...nit,
        registro: opcional(input.registro),
        ciudad_id: input.ciudad_id ?? undefined,
        tipos: input.tipos ? this.tiposValidos(input.tipos) : undefined,
      },
    });
    return this.findOne(actor, id);
  }

  async remove(actor: Actor, id: string) {
    await this.findAccessible(actor, id);
    await this.prisma.cliente.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ── Sedes ────────────────────────────────────────────────────────────────

  async sedes(actor: Actor, clienteId: string, incluirInactivas = false) {
    await this.findAccessible(actor, clienteId);
    const sedes = await this.prisma.sede.findMany({
      where: {
        cliente_id: clienteId,
        ...(incluirInactivas ? { deleted_at: undefined } : {}),
      },
      include: sedeInclude,
      orderBy: [{ principal: 'desc' }, { nombre: 'asc' }],
    });
    return sedes.map(toSede);
  }

  async createSede(actor: Actor, input: CreateSedeInput) {
    await this.findAccessible(actor, input.cliente_id);
    await this.validarSede(input);
    const sede = await this.prisma.$transaction(async (tx) => {
      const activas = await tx.sede.count({
        where: { cliente_id: input.cliente_id },
      });
      // The first active sede is always the principal one
      const principal = input.principal === true || activas === 0;
      if (principal) await this.quitarPrincipal(tx, input.cliente_id);
      return tx.sede.create({
        data: {
          ...this.datosSede(input),
          cliente_id: input.cliente_id,
          principal,
        },
        include: sedeInclude,
      });
    });
    return toSede(sede);
  }

  async updateSede(actor: Actor, id: string, input: UpdateSedeInput) {
    const sede = await this.findSede(actor, id);
    if (input.principal === false && sede.principal) {
      throw new BadRequestException(
        'Marca otra sede como principal: siempre debe haber una',
      );
    }
    await this.validarSede(input);
    const { principal, ...datos } = input;
    const updated = await this.prisma.$transaction(async (tx) => {
      if (principal && !sede.principal) {
        await this.quitarPrincipal(tx, sede.cliente_id);
      }
      return tx.sede.update({
        where: { id },
        data: {
          nombre: datos.nombre ? limpiarNombre(datos.nombre) : undefined,
          direccion: datos.direccion?.trim() || undefined,
          ciudad_id: datos.ciudad_id ?? undefined,
          actividad_economica_id: datos.actividad_economica_id,
          telefono: opcional(datos.telefono),
          barrio: opcional(datos.barrio),
          localidad: opcional(datos.localidad),
          email: opcional(datos.email),
          principal: principal ? true : undefined,
        },
        include: sedeInclude,
      });
    });
    return toSede(updated);
  }

  async deleteSede(actor: Actor, id: string) {
    const sede = await this.findSede(actor, id);
    if (sede.principal) {
      throw new BadRequestException(
        'No se puede desactivar la sede principal: marca otra como principal primero',
      );
    }
    // Not the principal, so the cliente keeps at least that one
    await this.prisma.sede.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ── Contactos ────────────────────────────────────────────────────────────

  // Contactos of the cliente; those of the given sede come first.
  async contactos(
    actor: Actor,
    clienteId: string,
    sedeId?: string,
    search?: string,
  ) {
    await this.findAccessible(actor, clienteId);
    const texto = search?.trim();
    const contactos = await this.prisma.contacto.findMany({
      where: {
        cliente_id: clienteId,
        ...(texto
          ? {
              OR: [
                { nombre: { contains: texto, mode: 'insensitive' } },
                { cargo: { contains: texto, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { nombre: 'asc' },
    });
    return sedeId
      ? [
          ...contactos.filter((c) => c.sede_id === sedeId),
          ...contactos.filter((c) => c.sede_id !== sedeId),
        ]
      : contactos;
  }

  async createContacto(actor: Actor, input: CreateContactoInput) {
    await this.findAccessible(actor, input.cliente_id);
    if (input.sede_id) await this.assertSedeDe(input.sede_id, input.cliente_id);
    return this.prisma.contacto.create({
      data: {
        cliente_id: input.cliente_id,
        sede_id: input.sede_id ?? null,
        nombre: limpiarNombre(input.nombre),
        documento: opcional(input.documento),
        cargo: opcional(input.cargo),
        telefono: opcional(input.telefono),
        email: opcional(input.email),
      },
    });
  }

  async updateContacto(actor: Actor, id: string, input: UpdateContactoInput) {
    const contacto = await this.findContacto(actor, id);
    if (input.sede_id) {
      await this.assertSedeDe(input.sede_id, contacto.cliente_id);
    }
    return this.prisma.contacto.update({
      where: { id },
      data: {
        sede_id: input.sede_id,
        nombre: input.nombre ? limpiarNombre(input.nombre) : undefined,
        documento: opcional(input.documento),
        cargo: opcional(input.cargo),
        telefono: opcional(input.telefono),
        email: opcional(input.email),
      },
    });
  }

  async deleteContacto(actor: Actor, id: string) {
    await this.findContacto(actor, id);
    await this.prisma.contacto.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Not found (instead of forbidden) so other tenants' ids are not disclosed.
  private async findAccessible(actor: Actor, id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: clienteInclude,
    });
    const empresaIds = cliente
      ? await accessibleEmpresaIds(this.prisma, actor)
      : null;
    if (!cliente || (empresaIds && !empresaIds.includes(cliente.empresa_id))) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }

  private async findSede(actor: Actor, id: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id } });
    if (!sede) throw new NotFoundException('Sede no encontrada');
    await this.findAccessible(actor, sede.cliente_id);
    return sede;
  }

  private async findContacto(actor: Actor, id: string) {
    const contacto = await this.prisma.contacto.findUnique({ where: { id } });
    if (!contacto) throw new NotFoundException('Contacto no encontrado');
    await this.findAccessible(actor, contacto.cliente_id);
    return contacto;
  }

  private async assertSedeDe(sedeId: string, clienteId: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede || sede.cliente_id !== clienteId) {
      throw new BadRequestException('La sede no pertenece al cliente');
    }
  }

  // NIT is unique per tenant, deleted clientes included (DB constraint).
  private async assertNitLibre(empresaId: string, nit: string) {
    const existing = await this.prisma.cliente.findUnique({
      where: {
        empresa_id_nit: { empresa_id: empresaId, nit },
        deleted_at: undefined,
      },
    });
    if (existing) {
      throw new ConflictException(
        existing.deleted_at
          ? 'Ese NIT pertenece a un cliente eliminado'
          : `Ya existe un cliente con ese NIT: ${existing.razon_social}`,
      );
    }
  }

  private async validarSede(sede: Partial<SedeDatosInput>) {
    if (sede.ciudad_id) await this.catalogos.assertCiudad(sede.ciudad_id);
    if (sede.actividad_economica_id) {
      await this.catalogos.assertActividad(sede.actividad_economica_id);
    }
  }

  private datosSede(sede: SedeDatosInput) {
    return {
      nombre: limpiarNombre(sede.nombre),
      direccion: sede.direccion.trim(),
      ciudad_id: sede.ciudad_id,
      actividad_economica_id: sede.actividad_economica_id ?? null,
      telefono: opcional(sede.telefono) ?? null,
      barrio: opcional(sede.barrio) ?? null,
      localidad: opcional(sede.localidad) ?? null,
      email: opcional(sede.email) ?? null,
    };
  }

  private async quitarPrincipal(tx: Tx, clienteId: string) {
    await tx.sede.updateMany({
      where: { cliente_id: clienteId, principal: true },
      data: { principal: false },
    });
  }

  private tiposValidos(tipos: TipoEmpresa[]) {
    const unicos = [...new Set(tipos)];
    if (unicos.length === 0) {
      throw new BadRequestException('Elige al menos un tipo de empresa');
    }
    return unicos;
  }
}
