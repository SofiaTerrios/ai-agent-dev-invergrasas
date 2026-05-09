import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateClienteDto) {
    // Verify that the empresa exists
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: data.empresa_id },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
    }

    return this.prisma.cliente.create({ data });
  }

  async update(id: string, data: UpdateClienteDto) {
    const existing = await this.prisma.cliente.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Cliente not found');
    }

    // If empresa_id is being updated, verify it exists
    if (data.empresa_id && data.empresa_id !== existing.empresa_id) {
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: data.empresa_id },
      });
      if (!empresa) {
        throw new NotFoundException('Empresa not found');
      }
    }

    return this.prisma.cliente.update({ where: { id }, data });
  }

  async findAllByEmpresa(empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
    }

    return this.prisma.cliente.findMany({
      where: { empresa_id: empresaId },
    });
  }

  async findAll() {
    return this.prisma.cliente.findMany({
      include: { empresa: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.cliente.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Cliente not found');
    }

    await this.prisma.cliente.delete({ where: { id } });
  }
}
