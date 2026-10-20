import { ArgsType, Field, ID } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaginationArgs } from '../common/pagination';
import { PedidoFiltersInput } from './inputs';

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
}
