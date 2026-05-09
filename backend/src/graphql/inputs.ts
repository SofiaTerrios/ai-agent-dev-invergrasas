import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { CertificadoTipo, Producto, Role, TipoEmpaque } from './enums';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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

  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  rol?: Role;
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

@InputType()
export class CreateClienteInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  contacto!: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  telefono!: string;

  @Field()
  @IsNotEmpty()
  @IsEmail()
  correo!: string;

  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  empresa_id!: string;
}

@InputType()
export class UpdateClienteInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nombre?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  contacto?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;
}

@InputType()
export class PedidoFiltersInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @Field(() => Producto, { nullable: true })
  @IsOptional()
  @IsEnum(Producto)
  producto?: Producto;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fecha_fin?: string;
}

@InputType()
export class CreatePedidoInput {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  empresa_id!: string;

  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  cliente_id!: string;

  @Field(() => Producto)
  @IsNotEmpty()
  @IsEnum(Producto)
  producto!: Producto;

  @Field(() => TipoEmpaque)
  @IsNotEmpty()
  @IsEnum(TipoEmpaque)
  tipo_empaque!: TipoEmpaque;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  cantidad_kg!: number;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  fecha!: string;
}

@InputType()
export class UpdatePedidoInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @Field(() => Producto, { nullable: true })
  @IsOptional()
  @IsEnum(Producto)
  producto?: Producto;

  @Field(() => TipoEmpaque, { nullable: true })
  @IsOptional()
  @IsEnum(TipoEmpaque)
  tipo_empaque?: TipoEmpaque;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidad_kg?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fecha?: string;
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
}