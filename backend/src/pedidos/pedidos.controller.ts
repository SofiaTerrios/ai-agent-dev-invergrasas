import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { FilterPedidoDto } from './dto/filter-pedido.dto';
import { PedidosService } from './pedidos.service';

@Controller('api/pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  @Permiso('pedidos', 'leer')
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: FilterPedidoDto,
  ) {
    const { first, after, ...rest } = filters;
    return this.pedidosService.listForUser(user, rest, { first, after });
  }
}
