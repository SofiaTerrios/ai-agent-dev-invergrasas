import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CertificadoTipo, Producto, Role, TipoEmpaque } from './enums';
import { ConnectionType } from '../common/pagination';

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

  @Field({ description: 'Debe cambiar la contraseña antes de seguir' })
  debe_cambiar_password!: boolean;

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

// User as seen from the user management module (super admin)
@ObjectType()
export class UsuarioModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field()
  email!: string;

  @Field(() => Role)
  rol!: Role;

  @Field(() => String, { nullable: true })
  documento?: string | null;

  @Field(() => String, { nullable: true })
  telefono?: string | null;

  @Field({ description: 'false cuando el usuario está desactivado' })
  activo!: boolean;

  @Field()
  debe_cambiar_password!: boolean;

  @Field()
  tiene_firma!: boolean;

  @Field(() => [EmpresaModel])
  empresas!: EmpresaModel[];

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

@ObjectType()
export class ParametroAnalisisModel {
  @Field()
  nombre!: string;

  @Field()
  valor!: string;

  @Field(() => Int)
  orden!: number;
}

@ObjectType()
export class CertificadoModel {
  @Field(() => ID)
  id!: string;

  @Field(() => CertificadoTipo)
  tipo!: CertificadoTipo;

  @Field(() => ID, { nullable: true })
  empresa_id?: string | null;

  @Field(() => ID, { nullable: true })
  cliente_id?: string | null;

  @Field()
  empresa_cliente!: string;

  @Field(() => String, { nullable: true })
  nit_cliente?: string | null;

  @Field()
  lote!: string;

  @Field(() => Float, { nullable: true })
  peso_kg?: number | null;

  @Field()
  fecha_emision!: Date;

  @Field()
  fecha_vencimiento!: Date;

  @Field()
  firmado_por!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Ruta autenticada para descargar el PDF',
  })
  archivo_url?: string | null;

  @Field()
  created_at!: Date;

  @Field(() => [ParametroAnalisisModel])
  parametros!: ParametroAnalisisModel[];
}

@ObjectType()
export class EmpresaConnection extends ConnectionType(
  EmpresaModel,
  'Empresa',
) {}

@ObjectType()
export class UsuarioConnection extends ConnectionType(
  UsuarioModel,
  'Usuario',
) {}

@ObjectType()
export class ClienteConnection extends ConnectionType(
  ClienteModel,
  'Cliente',
) {}

@ObjectType()
export class PedidoConnection extends ConnectionType(PedidoModel, 'Pedido') {}

@ObjectType()
export class CertificadoConnection extends ConnectionType(
  CertificadoModel,
  'Certificado',
) {}
