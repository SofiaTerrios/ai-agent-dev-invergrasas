import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { UserEmpresa } from './entities/user-empresa.entity';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller.nest';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, UserEmpresa])],
  providers: [EmpresasService],
  controllers: [EmpresasController],
  exports: [EmpresasService],
})
export class EmpresasModule {}
