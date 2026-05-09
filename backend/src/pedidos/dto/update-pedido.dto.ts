import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Producto, TipoEmpaque } from '../../graphql/enums';

export class UpdatePedidoDto {
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @IsOptional()
  @IsEnum(Producto)
  producto?: Producto;

  @IsOptional()
  @IsEnum(TipoEmpaque)
  tipo_empaque?: TipoEmpaque;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidad_kg?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
