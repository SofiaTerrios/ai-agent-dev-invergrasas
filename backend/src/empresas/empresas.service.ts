import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationArgs } from '../common/pagination';
import { accessibleEmpresaIds } from './empresa-access';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEmpresaDto) {
    // nit is unique at DB level, so soft-deleted empresas still hold it
    const exists = await this.prisma.empresa.findUnique({
      where: { nit: data.nit, deleted_at: undefined },
    });
    if (exists) throw new ConflictException('NIT_EXISTS');
    return this.prisma.empresa.create({ data });
  }

  async update(id: string, data: UpdateEmpresaDto) {
    const existing = await this.prisma.empresa.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    if (data.nit && data.nit !== existing.nit) {
      const conflict = await this.prisma.empresa.findUnique({
        where: { nit: data.nit, deleted_at: undefined },
      });
      if (conflict) throw new ConflictException('NIT_EXISTS');
    }
    return this.prisma.empresa.update({ where: { id }, data });
  }

  // Admins get every empresa, other users only the ones they are linked to.
  async list(actor: { id: string; rol?: string }, pagination?: PaginationArgs) {
    const empresaIds = await accessibleEmpresaIds(this.prisma, actor);
    const where: Prisma.EmpresaWhereInput = empresaIds
      ? { id: { in: empresaIds } }
      : {};

    return paginate(
      pagination,
      (page) =>
        this.prisma.empresa.findMany({
          where,
          orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
          ...page,
        }),
      () => this.prisma.empresa.count({ where }),
    );
  }

  async associateUserToEmpresa(empresaId: string, userId: string) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists) throw new NotFoundException('User not found');

    const empresaExists = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresaExists) throw new NotFoundException('Empresa not found');

    const existingLink = await this.prisma.userEmpresa.findUnique({
      where: { user_id_empresa_id: { user_id: userId, empresa_id: empresaId } },
    });

    if (existingLink) {
      // Prevents duplicate associations (silently ignore or return success)
      return { message: 'Already associated' };
    }

    // Restores a previously soft-deleted link instead of violating the unique key
    await this.prisma.userEmpresa.upsert({
      where: { user_id_empresa_id: { user_id: userId, empresa_id: empresaId } },
      create: { user_id: userId, empresa_id: empresaId },
      update: { deleted_at: null },
    });

    return { message: 'Association created successfully' };
  }
}
