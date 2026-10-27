import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CertificadoTipo, Role, TipoEmpresa, TipoMovimiento } from './enums';
import { ConnectionType } from '../common/pagination';

registerEnumType(Role, { name: 'Role' });
registerEnumType(CertificadoTipo, { name: 'CertificadoTipo' });
registerEnumType(TipoEmpresa, { name: 'TipoEmpresa' });
registerEnumType(TipoMovimiento, { name: 'TipoMovimiento' });

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

// ── Entregas y recolecciones (IG-39, IG-28, IG-31) ─────────────────────────

@ObjectType()
export class NombreModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;
}

@ObjectType()
export class EnvaseResumenModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field()
  retornable!: boolean;
}

@ObjectType()
export class SnapshotEmpresaModel {
  @Field()
  razon_social!: string;

  @Field(() => String, { nullable: true })
  nit?: string | null;

  @Field(() => String, { nullable: true })
  dv?: string | null;

  @Field(() => String, { nullable: true })
  registro?: string | null;

  @Field(() => String, { nullable: true })
  ciudad?: string | null;
}

@ObjectType()
export class SnapshotSedeModel {
  @Field()
  nombre!: string;

  @Field(() => String, { nullable: true })
  actividad?: string | null;

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

  @Field(() => String, { nullable: true })
  ciudad?: string | null;
}

@ObjectType()
export class SnapshotPersonaModel {
  @Field()
  nombre!: string;

  @Field(() => String, { nullable: true })
  cargo?: string | null;

  @Field(() => String, { nullable: true })
  documento?: string | null;
}

@ObjectType()
export class SnapshotVehiculoModel {
  @Field()
  placa!: string;

  @Field(() => String, { nullable: true })
  descripcion?: string | null;
}

// Data as printed on the certificado when it was issued
@ObjectType()
export class MovimientoSnapshotModel {
  @Field(() => SnapshotEmpresaModel)
  cliente!: SnapshotEmpresaModel;

  @Field(() => SnapshotSedeModel, { nullable: true })
  sede?: SnapshotSedeModel | null;

  @Field(() => SnapshotPersonaModel, { nullable: true })
  contacto?: SnapshotPersonaModel | null;

  @Field(() => SnapshotPersonaModel)
  conductor!: SnapshotPersonaModel;

  @Field(() => SnapshotVehiculoModel, { nullable: true })
  vehiculo?: SnapshotVehiculoModel | null;

  @Field(() => SnapshotEmpresaModel, { nullable: true })
  transportador?: SnapshotEmpresaModel | null;

  @Field(() => SnapshotEmpresaModel, { nullable: true })
  destino?: SnapshotEmpresaModel | null;

  @Field(() => String, { nullable: true })
  texto?: string | null;
}

@ObjectType()
export class MovimientoLineaModel {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  orden!: number;

  @Field(() => NombreModel, { nullable: true })
  producto?: NombreModel | null;

  @Field(() => String, { nullable: true })
  unidad_medida?: string | null;

  @Field(() => Float, { nullable: true })
  cantidad?: number | null;

  @Field(() => EnvaseResumenModel)
  tipo_empaque!: EnvaseResumenModel;

  @Field(() => Int, { description: 'Envases llenos entregados' })
  cantidad_envases!: number;

  @Field(() => Int)
  vacios_recibidos!: number;

  @Field(() => Int)
  vacios_entregados!: number;
}

@ObjectType()
export class MovimientoModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  empresa_id!: string;

  @Field(() => Int)
  numero!: number;

  @Field(() => Int)
  anio!: number;

  @Field({ description: 'Ej.: 012-2026' })
  numero_formateado!: string;

  @Field(() => TipoMovimiento)
  tipo!: TipoMovimiento;

  @Field({ description: 'YYYY-MM-DD' })
  fecha!: string;

  @Field(() => ID)
  cliente_id!: string;

  @Field(() => ID, { nullable: true })
  sede_id?: string | null;

  @Field(() => ID, { nullable: true })
  contacto_id?: string | null;

  @Field(() => NombreModel, { description: 'Conductor que firma' })
  usuario_entrega!: NombreModel;

  @Field(() => String, { nullable: true })
  observacion?: string | null;

  @Field(() => MovimientoSnapshotModel)
  snapshot!: MovimientoSnapshotModel;

  @Field(() => [MovimientoLineaModel])
  lineas!: MovimientoLineaModel[];

  @Field(() => Float, { description: 'Suma de las líneas en kg' })
  total_kg!: number;

  @Field({ description: 'Ruta autenticada del PDF' })
  archivo_url!: string;

  @Field()
  anulado!: boolean;

  @Field(() => Date, { nullable: true })
  anulado_at?: Date | null;

  @Field(() => String, { nullable: true })
  anulado_por_nombre?: string | null;

  @Field(() => String, { nullable: true })
  motivo_anulacion?: string | null;

  @Field({ description: 'Viene de la antigua tabla de pedidos' })
  migrado!: boolean;

  @Field()
  created_at!: Date;
}

@ObjectType()
export class SaldoEnvaseModel {
  @Field(() => ClienteResumenModel)
  cliente!: ClienteResumenModel;

  @Field(() => NombreModel)
  tipo_empaque!: NombreModel;

  @Field(() => Int, { description: 'Envases que tiene el cliente' })
  saldo!: number;
}

@ObjectType()
export class MovimientoInventarioModel {
  @Field(() => ID)
  id!: string;

  @Field()
  fecha!: string;

  @Field(() => NombreModel)
  tipo_empaque!: NombreModel;

  @Field(() => Int, { description: '+ quedan en el cliente, − recogidos' })
  cantidad!: number;

  @Field(() => String, { nullable: true, description: 'Motivo del ajuste' })
  motivo?: string | null;

  @Field(() => String, { nullable: true })
  creado_por_nombre?: string | null;

  @Field(() => ID, { nullable: true })
  movimiento_id?: string | null;

  @Field(() => String, { nullable: true })
  movimiento_numero?: string | null;

  @Field(() => TipoMovimiento, { nullable: true })
  movimiento_tipo?: TipoMovimiento | null;

  @Field({ description: 'Del movimiento anulado: ya no cuenta' })
  anulado!: boolean;
}

@ObjectType()
export class ConductorModel {
  @Field(() => ID)
  id!: string;

  @Field()
  nombre!: string;

  @Field(() => ID, { nullable: true })
  vehiculo_por_defecto_id?: string | null;

  @Field({ description: 'Sin firma no puede emitir' })
  tiene_firma!: boolean;
}

@ObjectType()
export class TextoCertificadorModel {
  @Field(() => TipoMovimiento)
  tipo!: TipoMovimiento;

  @Field()
  texto!: string;
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
export class CertificadoConnection extends ConnectionType(
  CertificadoModel,
  'Certificado',
) {}

@ObjectType()
export class MovimientoConnection extends ConnectionType(
  MovimientoModel,
  'Movimiento',
) {}
