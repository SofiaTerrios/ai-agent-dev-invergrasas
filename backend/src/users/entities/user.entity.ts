import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

export type Role = 'admin' | 'empleado';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nombre!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'text' })
  rol!: Role;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @ManyToMany(() => Empresa, (empresa) => empresa.users)
  @JoinTable({ name: 'users_empresas' })
  empresas?: Empresa[];
}
