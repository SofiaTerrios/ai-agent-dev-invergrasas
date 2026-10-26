import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  CertificadoTipo,
  Producto,
  Role,
  TipoEmpaque,
  TipoEmpresa,
} from './enums';
import { ConnectionType } from '../common/pagination';

registerEnumType(Role, { name: 'Role' });
registerEnumType(Producto, { name: 'Producto' });
registerEnumType(TipoEmpaque, { name: 'TipoEmpaque' });
registerEnumType(CertificadoTipo, { name: 'CertificadoTipo' });
registerEnumType(TipoEmpresa, { name: 'TipoEmpresa' });

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

// ── Datos maestros (IG-35, IG-26, IG-36, IG-37, IG-38, IG-40) ──────────────

@ObjectType()
export class CiudadModel {
  @Field(() => ID)
  id!: string;

  @Field()
  codigo_dane!: string;

  @Field()
  nombre!: string;

  @Field()
  departamento!: string;
}

@ObjectType()
export class ActividadEconomicaModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;
}

@ObjectType()
export class TipoEmpaqueModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field(() => Float, { nullable: true })
  capacidad?: number | null;

  @Field(() => String, { nullable: true })
  unidad?: string | null;

  @Field({ description: 'Cuenta en el inventario de envases por cliente' })
  retornable!: boolean;
}

@ObjectType()
export class ProductoModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field(() => String, { nullable: true })
  descripcion?: string | null;

  @Field(() => [TipoEmpaqueModel], {
    description: 'Empaques en los que se puede entregar',
  })
  empaques!: TipoEmpaqueModel[];
}

@ObjectType()
export class ClienteResumenModel {
  @Field(() => ID)
  id!: string;

  @Field()
  razon_social!: string;
}

@ObjectType()
export class VehiculoModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  empresa_id!: string;

  @Field(() => ID)
  transportador_id!: string;

  @Field(() => ClienteResumenModel)
  transportador!: ClienteResumenModel;

  @Field({ description: 'Formato "ABC 123"' })
  placa!: string;

  @Field(() => String, { nullable: true })
  descripcion?: string | null;
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

  @Field(() => VehiculoModel, {
    nullable: true,
    description: 'Se precarga en los movimientos del conductor (IG-40)',
  })
  vehiculo_por_defecto?: VehiculoModel | null;

  @Field()
  created_at!: Date;
}

@ObjectType()
export class SedeModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  cliente_id!: string;

  @Field()
  nombre!: string;

  @Field(() => ActividadEconomicaModel, { nullable: true })
  actividad_economica?: ActividadEconomicaModel | null;

  @Field(() => String, { nullable: true })
  direccion?: string | null;

  @Field(() => String, { nullable: true })
  telefono?: string | null;

  @Field(() => String, { nullable: true })
  barrio?: string | null;

  @Field(() => String, { nullable: true })
  localidad?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => CiudadModel, { nullable: true })
  ciudad?: CiudadModel | null;

  @Field()
  principal!: boolean;

  @Field({ description: 'false cuando la sede está desactivada' })
  activa!: boolean;
}

@ObjectType()
export class ContactoModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  cliente_id!: string;

  @Field(() => ID, { nullable: true })
  sede_id?: string | null;

  @Field()
  nombre!: string;

  @Field(() => String, { nullable: true })
  documento?: string | null;

  @Field(() => String, { nullable: true })
  cargo?: string | null;

  @Field(() => String, { nullable: true })
  telefono?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;
}

// Empresa con la que trabaja Invergrasas (IG-36)
@ObjectType()
export class ClienteModel {
  @Field(() => ID)
  id!: string;

  @Field()
  razon_social!: string;

  @Field(() => String, { nullable: true, description: 'Solo dígitos' })
  nit?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Dígito de verificación',
  })
  dv?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Registro ambiental o sanitario',
  })
  registro?: string | null;

  @Field(() => CiudadModel, { nullable: true })
  ciudad?: CiudadModel | null;

  @Field(() => [TipoEmpresa])
  tipos!: TipoEmpresa[];

  @Field()
  empresa_id!: string;

  @Field({
    description:
      'Cliente migrado al que le faltan NIT, ciudad o la dirección de la sede principal',
  })
  datos_incompletos!: boolean;

  @Field(() => [SedeModel], { description: 'Sedes activas' })
  sedes!: SedeModel[];

  @Field(() => [ContactoModel], { description: 'Contactos activos' })
  contactos!: ContactoModel[];

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

  @Field(() => ClienteResumenModel, { nullable: true })
  cliente?: ClienteResumenModel;
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
  @Field(() => String, {
    nullable: true,
    description: 'Clave del parámetro en CertificadoParametrosInput',
  })
  clave?: string | null;

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

  @Field(() => EmpresaModel, { nullable: true })
  empresa?: EmpresaModel | null;

  @Field()
  anulado!: boolean;

  @Field(() => Date, { nullable: true })
  anulado_at?: Date | null;

  @Field(() => String, { nullable: true })
  anulado_por_nombre?: string | null;

  @Field(() => String, { nullable: true })
  motivo_anulacion?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Certificado anulado que este corrige',
  })
  reemplaza_id?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Certificado que corrige a este (si fue anulado y reemitido)',
  })
  reemplazado_por_id?: string | null;

  @Field()
  created_at!: Date;

  @Field(() => [ParametroAnalisisModel])
  parametros!: ParametroAnalisisModel[];
}

@ObjectType()
export class FirmanteModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field()
  tiene_firma!: boolean;
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
