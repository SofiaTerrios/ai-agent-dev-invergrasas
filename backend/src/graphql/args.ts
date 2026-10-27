import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaginationArgs } from '../common/pagination';
import { PedidoFiltersInput } from './inputs';
import { CertificadoTipo, TipoEmpresa } from './enums';

// Arguments of paginated queries. They extend PaginationArgs because the
// global ValidationPipe validates all field arguments against a single class.

@ArgsType()
export class ClientesByEmpresaArgs extends PaginationArgs {
  @Field(() => ID)
  @IsNotEmpty()
  @IsString()
  empresaId!: string;
}

@ArgsType()
export class PedidosArgs extends PaginationArgs {
  @Field(() => PedidoFiltersInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PedidoFiltersInput)
  filters?: PedidoFiltersInput;
}

@ArgsType()
export class CertificadosArgs extends PaginationArgs {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  empresaId?: string;

  @Field(() => CertificadoTipo, { nullable: true })
  @IsOptional()
  @IsEnum(CertificadoTipo)
  tipo?: CertificadoTipo;

  @Field({ nullable: true, description: 'Cliente, NIT o lote' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @Field({ nullable: true, description: 'Fecha de emisión desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @Field({ nullable: true, description: 'Fecha de emisión hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

@ArgsType()
export class UsuariosArgs extends PaginationArgs {
  @Field({ nullable: true, description: 'Incluir usuarios desactivados' })
  @IsOptional()
  @IsBoolean()
  incluirInactivos?: boolean;
}

@ArgsType()
export class ClientesArgs extends PaginationArgs {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  empresaId?: string;

  @Field({ nullable: true, description: 'Parte de la razón social o del NIT' })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => TipoEmpresa, { nullable: true })
  @IsOptional()
  @IsEnum(TipoEmpresa)
  tipo?: TipoEmpresa;
}
