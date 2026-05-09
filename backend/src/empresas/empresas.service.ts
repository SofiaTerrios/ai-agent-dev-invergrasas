import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEmpresaDto) {
    const exists = await this.prisma.empresa.findUnique({
      where: { nit: data.nit },
    });
    if (exists) throw new ConflictException('NIT_EXISTS');
    return this.prisma.empresa.create({ data });
  }

  async update(id: string, data: UpdateEmpresaDto) {
    const existing = await this.prisma.empresa.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    if (data.nit && data.nit !== existing.nit) {
      const conflict = await this.prisma.empresa.findUnique({
        where: { nit: data.nit },
      });
      if (conflict) throw new ConflictException('NIT_EXISTS');
    }
    return this.prisma.empresa.update({ where: { id }, data });
  }

  async findAllForUser(userId: string) {
    const links = await this.prisma.userEmpresa.findMany({
      where: { user_id: userId },
      include: { empresa: true },
    });
    if (!links || links.length === 0) return [];
    return links.map((link) => link.empresa);
  }

  async findAll() {
    return this.prisma.empresa.findMany({
      orderBy: { created_at: 'desc' },
    });
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

    await this.prisma.userEmpresa.create({
      data: {
        user_id: userId,
        empresa_id: empresaId,
      },
    });

    return { message: 'Association created successfully' };
  }
}
