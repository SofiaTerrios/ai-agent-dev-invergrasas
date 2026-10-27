import { Module } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { InventarioResolver } from './inventario.resolver';

@Module({
  providers: [InventarioService, InventarioResolver],
  exports: [InventarioService],
})
export class InventarioModule {}
