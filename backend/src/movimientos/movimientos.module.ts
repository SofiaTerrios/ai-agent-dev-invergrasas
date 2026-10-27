import { Module } from '@nestjs/common';
import { MovimientosService } from './movimientos.service';
import { MovimientosResolver } from './movimientos.resolver';
import { MovimientosController } from './movimientos.controller';
import { TextosService } from './textos.service';
import { MovimientoPdfService } from '../utils/pdf/movimiento-pdf.service';

@Module({
  controllers: [MovimientosController],
  providers: [
    MovimientosService,
    MovimientosResolver,
    TextosService,
    MovimientoPdfService,
  ],
  exports: [MovimientosService],
})
export class MovimientosModule {}
