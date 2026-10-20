import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Producto } from '../../graphql/enums';
import { PaginationArgs } from '../../common/pagination';

// Query params of GET /api/pedidos, including pagination (first/after)
export class FilterPedidoDto extends PaginationArgs {
  @IsOptional()
  @IsUUID()
  empresa_id?: string;

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
