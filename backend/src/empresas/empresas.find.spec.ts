import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresasService } from './empresas.service';
import { Empresa } from './entities/empresa.entity';
import { UserEmpresa } from './entities/user-empresa.entity';
import { Cliente } from '../clientes/entities/cliente.entity';

describe('EmpresasService - findAllForUser', () => {
  let service: EmpresasService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Empresa, UserEmpresa, Cliente],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Empresa, UserEmpresa, Cliente]),
      ],
      providers: [EmpresasService],
    }).compile();

    service = moduleRef.get<EmpresasService>(EmpresasService);
  });

  it('returns only empresas linked to user', async () => {
    const repo: any = (service as any).repo;
    const ueRepo: any = (service as any).userEmpresaRepo;
    const e1 = await repo.save(
      repo.create({ razon_social: 'Test1', nit: 't1' }),
    );
    const e2 = await repo.save(
      repo.create({ razon_social: 'Test2', nit: 't2' }),
    );
    const userId = 'u-abc';
    await ueRepo.save(ueRepo.create({ user_id: userId, empresa_id: e2.id }));

    const list = await service.findAllForUser(userId);
    expect(list.length).toBe(1);
    expect(list[0].nit).toBe('t2');
  });

  it('returns empty array for user with none', async () => {
    const list = await service.findAllForUser('no-one');
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });
});
