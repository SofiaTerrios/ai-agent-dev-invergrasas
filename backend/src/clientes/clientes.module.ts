import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller.nest';
import { ClientesResolver } from './clientes.resolver';

@Module({
  providers: [ClientesService, ClientesResolver],
  controllers: [ClientesController],
  exports: [ClientesService],
})
export class ClientesModule {}
