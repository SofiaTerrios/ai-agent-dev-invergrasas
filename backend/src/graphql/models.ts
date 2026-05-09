import { Field, Float, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CertificadoTipo, Producto, Role, TipoEmpaque } from './enums';

registerEnumType(Role, { name: 'Role' });
registerEnumType(Producto, { name: 'Producto' });
registerEnumType(TipoEmpaque, { name: 'TipoEmpaque' });
registerEnumType(CertificadoTipo, { name: 'CertificadoTipo' });

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field()
  email!: string;

  @Field(() => Role)
  rol!: Role;

  @Field()
  created_at!: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  access_token!: string;

  @Field(() => UserModel)
  user!: UserModel;
}

@ObjectType()
export class EmpresaModel {
  @Field(() => ID)
  id!: string;

  @Field()
  razon_social!: string;

  @Field()
  nit!: string;

  @Field({ nullable: true })
  direccion?: string;

  @Field({ nullable: true })
  telefono?: string;

  @Field({ nullable: true })
  correo?: string;

  @Field()
  created_at!: Date;
}

@ObjectType()
export class ClienteModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field()
  contacto!: string;

  @Field()
  telefono!: string;

  @Field()
  correo!: string;

  @Field()
  empresa_id!: string;

  @Field()
  created_at!: Date;
}

@ObjectType()
export class PedidoModel {
  @Field(() => ID)
  id!: string;

  @Field()
  empresa_id!: string;

  @Field()
  cliente_id!: string;

  @Field()
  creado_por!: string;

  @Field(() => Producto)
  producto!: Producto;

  @Field(() => TipoEmpaque)
  tipo_empaque!: TipoEmpaque;

  @Field(() => Float)
  cantidad_kg!: number;

  @Field()
  fecha!: Date;

  @Field()
  created_at!: Date;

  @Field(() => ClienteModel, { nullable: true })
  cliente?: ClienteModel;
}

@ObjectType()
export class MessagePayload {
  @Field()
  message!: string;
}

@ObjectType()
export class CertificadoAnalisisModel {
  @Field(() => ID)
  id!: string;

  @Field()
  archivo_url!: string;

  @Field()
  fecha_emision!: string;

  @Field()
  mensaje!: string;
}
