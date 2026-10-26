import { Module } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { VehiculosResolver } from './vehiculos.resolver';

@Module({
  providers: [VehiculosService, VehiculosResolver],
  exports: [VehiculosService],
})
export class VehiculosModule {}
