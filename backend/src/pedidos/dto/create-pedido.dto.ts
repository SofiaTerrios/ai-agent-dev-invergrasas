import {
  IsEnum,
  IsDateString,
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { Producto, TipoEmpaque } from '../../graphql/enums';

export class CreatePedidoDto {
  @IsNotEmpty()
  @IsUUID()
  empresa_id!: string;

  @IsNotEmpty()
  @IsUUID()
  cliente_id!: string;

  @IsNotEmpty()
  @IsEnum(Producto)
  producto!: Producto;

  @IsNotEmpty()
  @IsEnum(TipoEmpaque)
  tipo_empaque!: TipoEmpaque;

  @IsNumber()
  @Min(0)
  cantidad_kg!: number;

  @IsNotEmpty()
  @IsDateString()
  fecha!: string;
}
