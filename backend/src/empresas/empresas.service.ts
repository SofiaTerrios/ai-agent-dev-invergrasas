import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { UserEmpresa } from './entities/user-empresa.entity';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa) private repo: Repository<Empresa>,
    @InjectRepository(UserEmpresa) private userEmpresaRepo: Repository<UserEmpresa>,
  ) {}

  async create(data: Partial<Empresa>) {
    const exists = await this.repo.findOne({ where: { nit: data.nit } });
    if (exists) throw new Error('NIT_EXISTS');
    const ent = this.repo.create(data as any);
    const saved = await this.repo.save(ent);
    return saved;
  }

  async update(id: string, data: Partial<Empresa>) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new Error('NOT_FOUND');
    if (data.nit && data.nit !== existing.nit) {
      const conflict = await this.repo.findOne({ where: { nit: data.nit } });
      if (conflict) throw new Error('NIT_EXISTS');
    }
    const merged = this.repo.merge(existing, data as any);
    const saved = await this.repo.save(merged);
    return saved;
  }

  async findAllForUser(userId: string) {
    const links = await this.userEmpresaRepo.find({ where: { user_id: userId } });
    if (!links || links.length === 0) return [];
    const ids = links.map((l) => l.empresa_id);
    return this.repo.find({ where: { id: In(ids) } });
  }
}
