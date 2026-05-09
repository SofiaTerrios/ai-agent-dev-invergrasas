import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterPedidoDto } from './dto/filter-pedido.dto';
import { PedidosService } from './pedidos.service';

@Controller('api/pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  async findAll(@Request() req, @Query() filters: FilterPedidoDto) {
    const userId = req.user?.id ?? req.user?.userId;
    return this.pedidosService.listForUser(userId, filters);
  }
}
