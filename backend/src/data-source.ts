import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Empresa } from './empresas/entities/empresa.entity';
import { UserEmpresa } from './empresas/entities/user-empresa.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.NODE_ENV === 'test' ? ':memory:' : 'database.sqlite',
  synchronize: true,
  logging: false,
  entities: [User, Empresa, UserEmpresa],
});
