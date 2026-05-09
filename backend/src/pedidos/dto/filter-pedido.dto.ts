import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Producto } from '../../graphql/enums';

export class FilterPedidoDto {
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @IsOptional()
  @IsEnum(Producto)
  producto?: Producto;
}
