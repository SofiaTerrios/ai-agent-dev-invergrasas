import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';

@Entity({ name: 'empresas' })
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  razon_social!: string;

  @Index({ unique: true })
  @Column()
  nit!: string;

  @Column({ nullable: true })
  direccion?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  correo?: string;

  @CreateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
  })
  created_at!: Date;

  @ManyToMany(() => User, (user) => user.empresas)
  users?: User[];

  @OneToMany(() => Cliente, (cliente) => cliente.empresa)
  clientes?: Cliente[];
}
