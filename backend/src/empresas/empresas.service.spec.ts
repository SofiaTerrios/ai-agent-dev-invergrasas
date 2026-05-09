import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresasService } from './empresas.service';
import { Empresa } from './entities/empresa.entity';
import { UserEmpresa } from './entities/user-empresa.entity';
import { User } from '../users/entities/user.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { NotFoundException } from '@nestjs/common';

describe('EmpresasService', () => {
  let service: EmpresasService;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Empresa, UserEmpresa, User, Cliente],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Empresa, UserEmpresa, User, Cliente]),
      ],
      providers: [EmpresasService],
    }).compile();

    service = moduleRef.get<EmpresasService>(EmpresasService);
    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
  });

  it('creates empresa', async () => {
    const res = await service.create({
      razon_social: 'X',
      nit: '123',
      direccion: 'C',
      telefono: '1',
      correo: 'a@b.com',
    });
    expect(res).toHaveProperty('id');
    expect(res.nit).toBe('123');
  });

  it('throws on duplicate nit', async () => {
    await service.create({
      razon_social: 'A',
      nit: 'dup',
      correo: 'a@b.com',
    });
    await expect(
      service.create({ razon_social: 'B', nit: 'dup' } as any),
    ).rejects.toThrow('NIT_EXISTS');
  });

  it('updates empresa', async () => {
    const created = await service.create({
      razon_social: 'ToEdit',
      nit: 'U1',
      correo: 'u@u.com',
    });
    const updated = await service.update(created.id, {
      direccion: 'New Addr',
      telefono: '555',
    });
    expect(updated.direccion).toBe('New Addr');
    expect(updated.telefono).toBe('555');
  });

  it('throws on update not found', async () => {
    await expect(
      service.update('non-existent-id', { razon_social: 'X' } as any),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('throws on update duplicate nit', async () => {
    const a = await service.create({ razon_social: 'A1', nit: 'N1' });
    const b = await service.create({ razon_social: 'B1', nit: 'N2' });
    await expect(service.update(b.id, { nit: 'N1' } as any)).rejects.toThrow(
      'NIT_EXISTS',
    );
  });

  it('associates user to empresa and finds all for user', async () => {
    const user = userRepo.create({
      nombre: 'Test',
      email: 'test@test.com',
      password: '123',
      rol: 'empleado',
    } as any);
    await userRepo.save(user);

    const emp = await service.create({
      razon_social: 'Asociada',
      nit: 'A-123',
    });

    const res = await service.associateUserToEmpresa(emp.id, user.id);
    expect(res.message).toBe('Association created successfully');

    // Should ignore duplicates silently
    const resDup = await service.associateUserToEmpresa(emp.id, user.id);
    expect(resDup.message).toBe('Already associated');

    const list = await service.findAllForUser(user.id);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(emp.id);
  });

  it('throws NotFound when associating non-existent user or empresa', async () => {
    const user = userRepo.create({
      nombre: 'Test 2',
      email: 't2@test.com',
      password: '123',
      rol: 'empleado',
    } as any);
    await userRepo.save(user);

    await expect(
      service.associateUserToEmpresa('invalid-empresa', user.id),
    ).rejects.toThrow(NotFoundException);

    const emp = await service.create({
      razon_social: 'Inv',
      nit: 'Inv-1',
    });
    await expect(
      service.associateUserToEmpresa(emp.id, 'invalid-user'),
    ).rejects.toThrow(NotFoundException);
  });
});
