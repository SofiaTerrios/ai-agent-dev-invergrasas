import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { paginate } from '../common/pagination';
import { Role } from '../graphql/enums';
import { UsuariosArgs } from '../graphql/args';
import { CreateUsuarioInput, UpdateUsuarioInput } from '../graphql/inputs';
import { hashPassword } from '../utils/hash';
import { firmaDataUrl, parseFirma } from './firma';

type Actor = { id: string };

const PASSWORD_MIN_LENGTH = 6;
type Tx = Prisma.TransactionClient;

const USUARIO_ARGS = {
  omit: { password: true, firma: true },
  include: {
    empresas: {
      where: { deleted_at: null, empresa: { deleted_at: null } },
      include: { empresa: true },
      orderBy: { created_at: 'asc' },
    },
  },
} satisfies Prisma.UserDefaultArgs;

type UsuarioRow = Prisma.UserGetPayload<typeof USUARIO_ARGS>;

function toUsuario(user: UsuarioRow) {
  const { empresas, deleted_at, firma_mime, ...rest } = user;
  return {
    ...rest,
    activo: deleted_at === null,
    tiene_firma: firma_mime !== null,
    empresas: empresas.map((link) => link.empresa),
  };
}

// Serializable so two concurrent changes cannot remove the last super admin.
const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

/**
 * User management (IG-29), only for super_admin. Deactivating is a soft
 * delete: the user can no longer log in or use an existing token.
 */
@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  list(args: UsuariosArgs) {
    const where: Prisma.UserWhereInput = args.incluirInactivos
      ? { deleted_at: undefined }
      : {};
    return paginate(
      args,
      async (page) =>
        (
          await this.prisma.user.findMany({
            ...USUARIO_ARGS,
            where,
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
            ...page,
          })
        ).map(toUsuario),
      () => this.prisma.user.count({ where }),
    );
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      ...USUARIO_ARGS,
      where: { id, deleted_at: undefined },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return toUsuario(user);
  }

  async firma(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deleted_at: undefined },
      select: { firma: true, firma_mime: true },
    });
    return user?.firma && user.firma_mime
      ? firmaDataUrl(user.firma, user.firma_mime)
      : null;
  }

  async create(input: CreateUsuarioInput, actor: Actor) {
    await this.assertEmailLibre(input.email);
    const empresaIds = await this.validarEmpresas(input.empresa_ids ?? []);
    const firma = input.firma ? parseFirma(input.firma) : {};
    const password = await hashPassword(input.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          nombre: input.nombre,
          email: input.email,
          password,
          rol: input.rol,
          documento: input.documento,
          telefono: input.telefono,
          debe_cambiar_password: true,
          ...firma,
          empresas: {
            create: empresaIds.map((empresa_id) => ({ empresa_id })),
          },
        },
      });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'usuario.crear',
          entidad: 'usuario',
          entidadId: created.id,
          detalle: { rol: input.rol, empresa_ids: empresaIds },
        },
        tx,
      );
      return created;
    });
    return this.findOne(user.id);
  }

  async update(id: string, input: UpdateUsuarioInput, actor: Actor) {
    const existing = await this.prisma.user.findUnique({
      where: { id, deleted_at: undefined },
    });
    if (!existing) throw new NotFoundException('Usuario no encontrado');
    if (input.email && input.email !== existing.email) {
      await this.assertEmailLibre(input.email);
    }
    const empresaIds =
      input.empresa_ids && (await this.validarEmpresas(input.empresa_ids));
    const firma =
      input.firma === undefined
        ? {}
        : input.firma === null
          ? { firma: null, firma_mime: null }
          : parseFirma(input.firma);
    const rol: Rol | undefined = input.rol ?? undefined;
    const cambiaRol = rol !== undefined && rol !== existing.rol;

    await this.prisma.$transaction(async (tx) => {
      if (cambiaRol && existing.deleted_at === null) {
        await this.assertNoEsUltimoSuperAdmin(tx, existing);
      }
      await tx.user.update({
        where: { id },
        data: {
          nombre: input.nombre ?? undefined,
          email: input.email ?? undefined,
          rol,
          documento: input.documento,
          telefono: input.telefono,
          ...firma,
        },
      });
      if (empresaIds) await this.reemplazarEmpresas(tx, id, empresaIds);

      if (cambiaRol) {
        await this.auditoria.registrar(
          {
            actorId: actor.id,
            accion: 'usuario.cambiar_rol',
            entidad: 'usuario',
            entidadId: id,
            detalle: { de: existing.rol, a: rol },
          },
          tx,
        );
      }
      const campos = Object.entries(input)
        .filter(([campo, valor]) => valor !== undefined && campo !== 'rol')
        .map(([campo]) => campo);
      if (campos.length) {
        await this.auditoria.registrar(
          {
            actorId: actor.id,
            accion: 'usuario.editar',
            entidad: 'usuario',
            entidadId: id,
            detalle: { campos, empresa_ids: empresaIds },
          },
          tx,
        );
      }
    }, SERIALIZABLE);
    return this.findOne(id);
  }

  updateRol(id: string, rol: Role, actor: Actor) {
    return this.update(id, { rol }, actor);
  }

  async desactivar(id: string, actor: Actor) {
    if (id === actor.id) {
      throw new BadRequestException('No puedes desactivar tu propio usuario');
    }
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.$transaction(async (tx) => {
      await this.assertNoEsUltimoSuperAdmin(tx, existing);
      await tx.user.update({ where: { id }, data: { deleted_at: new Date() } });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'usuario.desactivar',
          entidad: 'usuario',
          entidadId: id,
        },
        tx,
      );
    }, SERIALIZABLE);
    return this.findOne(id);
  }

  async reactivar(id: string, actor: Actor) {
    const existing = await this.prisma.user.findUnique({
      where: { id, deleted_at: { not: null } },
    });
    if (!existing) {
      throw new NotFoundException('Usuario no encontrado o ya está activo');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { deleted_at: null } });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'usuario.reactivar',
          entidad: 'usuario',
          entidadId: id,
        },
        tx,
      );
    });
    return this.findOne(id);
  }

  // Sets a temporary password that must be changed on the next login.
  async restablecerPassword(id: string, password: string, actor: Actor) {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
      );
    }
    const existing = await this.prisma.user.findUnique({
      where: { id, deleted_at: undefined },
    });
    if (!existing) throw new NotFoundException('Usuario no encontrado');
    const hashed = await hashPassword(password);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { password: hashed, debe_cambiar_password: true },
      });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'usuario.restablecer_password',
          entidad: 'usuario',
          entidadId: id,
        },
        tx,
      );
    });
    return this.findOne(id);
  }

  // Called before demoting or deactivating an active user.
  private async assertNoEsUltimoSuperAdmin(
    tx: Tx,
    user: { id: string; rol: Rol },
  ) {
    if (user.rol !== Rol.super_admin) return;
    const otros = await tx.user.count({
      where: { rol: Rol.super_admin, id: { not: user.id } },
    });
    if (otros === 0) {
      throw new BadRequestException(
        'Debe quedar al menos un Super Administrador activo',
      );
    }
  }

  private async assertEmailLibre(email: string) {
    // email is unique at DB level, so deactivated users still hold it
    const existing = await this.prisma.user.findUnique({
      where: { email, deleted_at: undefined },
    });
    if (existing) throw new ConflictException('Email already registered');
  }

  private async validarEmpresas(ids: string[]) {
    const unique = [...new Set(ids)];
    const found = await this.prisma.empresa.count({
      where: { id: { in: unique } },
    });
    if (found !== unique.length) {
      throw new BadRequestException('Empresa no encontrada');
    }
    return unique;
  }

  private async reemplazarEmpresas(
    tx: Tx,
    userId: string,
    empresaIds: string[],
  ) {
    await tx.userEmpresa.updateMany({
      where: {
        user_id: userId,
        empresa_id: { notIn: empresaIds },
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });
    for (const empresa_id of empresaIds) {
      // Restores a soft-deleted link instead of violating the unique key
      await tx.userEmpresa.upsert({
        where: { user_id_empresa_id: { user_id: userId, empresa_id } },
        create: { user_id: userId, empresa_id },
        update: { deleted_at: null },
      });
    }
  }
}
