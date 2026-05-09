import { Module } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PedidosResolver } from './pedidos.resolver';

@Module({
  controllers: [PedidosController],
  providers: [PedidosService, PedidosResolver],
  exports: [PedidosService],
})
export class PedidosModule {}
