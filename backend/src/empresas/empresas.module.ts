import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller.nest';
import { EmpresasResolver } from './empresas.resolver';

@Module({
  providers: [EmpresasService, EmpresasResolver],
  controllers: [EmpresasController],
  exports: [EmpresasService],
})
export class EmpresasModule {}
