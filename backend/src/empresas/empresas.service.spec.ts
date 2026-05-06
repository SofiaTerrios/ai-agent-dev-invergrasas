import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresasService } from './empresas.service';
import { Empresa } from './entities/empresa.entity';
import { UserEmpresa } from './entities/user-empresa.entity';

describe('EmpresasService', () => {
  let service: EmpresasService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot({ type: 'sqlite', database: ':memory:', entities: [Empresa, UserEmpresa], synchronize: true }), TypeOrmModule.forFeature([Empresa, UserEmpresa])],
      providers: [EmpresasService],
    }).compile();

    service = moduleRef.get<EmpresasService>(EmpresasService);
  });

  it('creates empresa', async () => {
    const res = await service.create({ razon_social: 'X', nit: '123', direccion: 'C', telefono: '1', correo: 'a@b.com' } as any);
    expect(res).toHaveProperty('id');
    expect(res.nit).toBe('123');
  });

  it('throws on duplicate nit', async () => {
    await service.create({ razon_social: 'A', nit: 'dup', correo: 'a@b.com' } as any);
    await expect(service.create({ razon_social: 'B', nit: 'dup' } as any)).rejects.toThrow('NIT_EXISTS');
  });

  it('updates empresa', async () => {
    const created = await service.create({ razon_social: 'ToEdit', nit: 'U1', correo: 'u@u.com' } as any);
    const updated = await service.update(created.id, { direccion: 'New Addr', telefono: '555' } as any);
    expect(updated.direccion).toBe('New Addr');
    expect(updated.telefono).toBe('555');
  });

  it('throws on update not found', async () => {
    await expect(service.update('non-existent-id', { razon_social: 'X' } as any)).rejects.toThrow('NOT_FOUND');
  });

  it('throws on update duplicate nit', async () => {
    const a = await service.create({ razon_social: 'A1', nit: 'N1' } as any);
    const b = await service.create({ razon_social: 'B1', nit: 'N2' } as any);
    await expect(service.update(b.id, { nit: 'N1' } as any)).rejects.toThrow('NIT_EXISTS');
  });
});