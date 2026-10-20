import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { PERMISOS } from '../auth/roles';
import { FilterPedidoDto } from './dto/filter-pedido.dto';
import { PedidosService } from './pedidos.service';

@Controller('api/pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  @Roles(...PERMISOS.pedidos.leer)
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: FilterPedidoDto,
  ) {
    const { first, after, ...rest } = filters;
    return this.pedidosService.listForUser(user.id, rest, { first, after });
  }
}
