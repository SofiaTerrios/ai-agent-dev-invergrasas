import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { User } from '../../users/entities/user.entity';

export enum Producto {
  RBD = 'RBD',
  Oleina = 'Oleina',
}

export enum TipoEmpaque {
  Granel = 'Granel',
  Caneca = 'Caneca',
  Balde = 'Balde',
}

@Entity({ name: 'pedidos' })
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  empresa_id!: string;

  @Column()
  cliente_id!: string;

  @Column()
  creado_por!: string;

  @Column({ type: 'text' })
  producto!: Producto;

  @Column({ type: 'text' })
  tipo_empaque!: TipoEmpaque;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad_kg!: number;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @CreateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
  })
  created_at!: Date;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  @ManyToOne(() => Cliente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente?: Cliente;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creado_por' })
  usuario?: User;
}
