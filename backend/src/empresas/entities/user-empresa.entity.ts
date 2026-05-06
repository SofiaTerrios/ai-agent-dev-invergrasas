import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'user_empresas' })
export class UserEmpresa {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  user_id!: string;

  @Index()
  @Column()
  empresa_id!: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
