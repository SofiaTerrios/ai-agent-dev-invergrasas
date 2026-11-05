import { Module } from '@nestjs/common';
import { InformesService } from './informes.service';
import { InformesController } from './informes.controller';
import { MovimientosModule } from '../movimientos/movimientos.module';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [MovimientosModule, InventarioModule],
  controllers: [InformesController],
  providers: [InformesService],
})
export class InformesModule {}
