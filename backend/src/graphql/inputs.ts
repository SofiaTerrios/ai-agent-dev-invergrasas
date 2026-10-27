import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { CertificadoTipo, Role, TipoEmpresa, TipoMovimiento } from './enums';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class RegisterInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  password!: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  password_actual!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password_nueva!: string;
}

// Signature image as a data URL (`data:image/png;base64,...`), at most
// FIRMA_MAX_BYTES once decoded (checked in usuarios/firma.ts).
const FIRMA_DESCRIPCION =
  'Imagen de la firma como data URL (PNG o JPEG, máx. 300 KB)';
const FIRMA_MAX_LENGTH = 420_000;

@InputType()
export class CreateUsuarioInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @Field({ description: 'Contraseña inicial: se pide cambiarla al ingresar' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @Field(() => Role)
  @IsEnum(Role)
  rol!: Role;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  documento?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  empresa_ids?: string[];

  @Field({ nullable: true, description: FIRMA_DESCRIPCION })
  @IsOptional()
  @IsString()
  @MaxLength(FIRMA_MAX_LENGTH)
  firma?: string;
}

@InputType()
export class UpdateUsuarioInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nombre?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  rol?: Role;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  documento?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string | null;

  @Field(() => [ID], {
    nullable: true,
    description: 'Reemplaza las empresas asignadas',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  empresa_ids?: string[];

  @Field(() => String, {
    nullable: true,
    description: `${FIRMA_DESCRIPCION}. null la quita`,
  })
  @IsOptional()
  @IsString()
  @MaxLength(FIRMA_MAX_LENGTH)
  firma?: string | null;
}

@InputType()
export class CreateEmpresaInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  razon_social!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  nit!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  direccion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  correo?: string;
}

@InputType()
export class UpdateEmpresaInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  razon_social?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nit?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  direccion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  correo?: string;
}

// Datos de un local del cliente (IG-37)
@InputType()
export class SedeDatosInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  direccion!: string;

  @Field(() => ID)
  @IsUUID()
  ciudad_id!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  actividad_economica_id?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  barrio?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Solo aplica a Bogotá',
  })
  @IsOptional()
  @IsString()
  localidad?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

@InputType()
export class CreateSedeInput extends SedeDatosInput {
  @Field(() => ID)
  @IsUUID()
  cliente_id!: string;

  @Field({ nullable: true, description: 'La convierte en la sede principal' })
  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

@InputType()
export class UpdateSedeInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nombre?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  direccion?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  ciudad_id?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  actividad_economica_id?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  barrio?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  localidad?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @Field({
    nullable: true,
    description: 'true la convierte en principal (la anterior deja de serlo)',
  })
  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}

@InputType()
export class CreateClienteInput {
  @Field(() => ID, { description: 'Empresa de Invergrasas dueña del registro' })
  @IsUUID()
  empresa_id!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  razon_social!: string;

  @Field({ description: 'Con o sin dígito de verificación: 900123456-7' })
  @IsNotEmpty()
  @IsString()
  nit!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  registro?: string | null;

  @Field(() => ID)
  @IsUUID()
  ciudad_id!: string;

  @Field(() => [TipoEmpresa])
  @IsArray()
  @IsEnum(TipoEmpresa, { each: true })
  tipos!: TipoEmpresa[];

  @Field(() => SedeDatosInput, { description: 'Primera sede (principal)' })
  @ValidateNested()
  @Type(() => SedeDatosInput)
  sede_principal!: SedeDatosInput;
}

@InputType()
export class UpdateClienteInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  razon_social?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nit?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  registro?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  ciudad_id?: string;

  @Field(() => [TipoEmpresa], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TipoEmpresa, { each: true })
  tipos?: TipoEmpresa[];
}

// Persona del cliente que recibe o entrega (IG-38)
@InputType()
export class CreateContactoInput {
  @Field(() => ID)
  @IsUUID()
  cliente_id!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sede_id?: string | null;

  @Field()
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  documento?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  cargo?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

@InputType()
export class UpdateContactoInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  sede_id?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nombre?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  documento?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  cargo?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

@InputType()
export class CertificadoParametrosInput {
  @Field()
  @IsString()
  acidez!: string;

  @Field()
  @IsString()
  humedad!: string;

  @Field()
  @IsString()
  indice_yodo!: string;

  @Field()
  @IsString()
  peroxido!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  punto_nube?: string;

  @Field()
  @IsString()
  color_amarillo!: string;

  @Field()
  @IsString()
  color_rojo!: string;
}

@InputType()
export class CreateCertificadoInput {
  @Field(() => ID)
  @IsUUID()
  empresa_id!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @Field(() => CertificadoTipo)
  @IsEnum(CertificadoTipo)
  tipo!: CertificadoTipo;

  @Field()
  @IsNotEmpty()
  empresa_cliente!: string;

  @Field({ nullable: true })
  @IsOptional()
  nit_cliente?: string;

  @Field()
  @IsNotEmpty()
  lote!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  peso_kg?: number;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  fecha_vencimiento!: string;

  @Field(() => CertificadoParametrosInput)
  @ValidateNested()
  @Type(() => CertificadoParametrosInput)
  parametros!: CertificadoParametrosInput;

  @Field(() => ID, {
    nullable: true,
    description: 'Certificado anulado que este corrige',
  })
  @IsOptional()
  @IsUUID()
  reemplaza_id?: string;
}

// ── Catálogos (IG-35, IG-26) ────────────────────────────────────────────────

@InputType()
export class ProductoInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descripcion?: string | null;
}

@InputType()
export class UpdateProductoInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nombre?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descripcion?: string | null;
}

@InputType()
export class TipoEmpaqueInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidad?: number | null;

  @Field(() => String, { nullable: true, description: 'Ej.: galones, kg' })
  @IsOptional()
  @IsString()
  unidad?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  retornable?: boolean;
}

@InputType()
export class UpdateTipoEmpaqueInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  nombre?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidad?: number | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  unidad?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  retornable?: boolean;
}

// ── Vehículos (IG-40) ───────────────────────────────────────────────────────

@InputType()
export class CreateVehiculoInput {
  @Field(() => ID)
  @IsUUID()
  empresa_id!: string;

  @Field(() => ID, { description: 'Cliente con tipo TRANSPORTADOR' })
  @IsUUID()
  transportador_id!: string;

  @Field({ description: 'Se guarda como "ABC 123"' })
  @IsNotEmpty()
  @IsString()
  placa!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descripcion?: string | null;
}

@InputType()
export class UpdateVehiculoInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  transportador_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  placa?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descripcion?: string | null;
}

// ── Entregas y recolecciones (IG-39) ────────────────────────────────────────

@InputType()
export class MovimientoLineaInput {
  @Field(() => ID, {
    nullable: true,
    description: 'Producto entregado; vacío en líneas de solo recolección',
  })
  @IsOptional()
  @IsUUID()
  producto_id?: string | null;

  @Field(() => String, { nullable: true, description: 'kg, galón o litro' })
  @IsOptional()
  @IsString()
  unidad_medida?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Cantidad entregada; acepta coma o punto decimal',
  })
  @IsOptional()
  @IsString()
  cantidad?: string | null;

  @Field(() => ID)
  @IsUUID()
  tipo_empaque_id!: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Envases llenos entregados',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  cantidad_envases?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  vacios_recibidos?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  vacios_entregados?: number;
}

// Sede data that can be corrected only for this certificado
@InputType()
export class SedeDatosMovimientoInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  actividad?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  direccion?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  barrio?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  localidad?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  email?: string | null;
}

@InputType()
export class CreateMovimientoInput {
  @Field(() => ID)
  @IsUUID()
  empresa_id!: string;

  @Field(() => TipoMovimiento)
  @IsEnum(TipoMovimiento)
  tipo!: TipoMovimiento;

  @Field({ description: 'YYYY-MM-DD; no puede ser futura' })
  @IsDateString()
  fecha!: string;

  @Field(() => ID)
  @IsUUID()
  cliente_id!: string;

  @Field(() => ID)
  @IsUUID()
  sede_id!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  contacto_id?: string | null;

  @Field(() => ID, {
    nullable: true,
    description: 'Conductor; solo admin elige otro distinto de sí mismo',
  })
  @IsOptional()
  @IsUUID()
  usuario_entrega_id?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  vehiculo_id?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  transportador_id?: string | null;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  destino_id?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  observacion?: string | null;

  @Field(() => SedeDatosMovimientoInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SedeDatosMovimientoInput)
  sede_datos?: SedeDatosMovimientoInput | null;

  @Field(() => [MovimientoLineaInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovimientoLineaInput)
  lineas!: MovimientoLineaInput[];
}

@InputType()
export class AjusteInventarioInput {
  @Field(() => ID)
  @IsUUID()
  cliente_id!: string;

  @Field(() => ID)
  @IsUUID()
  tipo_empaque_id!: string;

  @Field(() => Int, {
    description:
      'Positivo: envases que el cliente ya tiene; negativo: corrige a la baja',
  })
  @IsInt()
  cantidad!: number;

  @Field()
  @IsNotEmpty()
  @IsString()
  motivo!: string;
}
