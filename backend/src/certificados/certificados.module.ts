import { Module } from '@nestjs/common';
import { CertificadosController } from './certificados.controller';
import { CertificadosService } from './certificados.service';
import { CertificadosResolver } from './certificados.resolver';
import { AnalisisPdfService } from '../utils/pdf/analisis-pdf.service';

@Module({
  controllers: [CertificadosController],
  providers: [CertificadosService, CertificadosResolver, AnalisisPdfService],
  exports: [CertificadosService],
})
export class CertificadosModule {}
