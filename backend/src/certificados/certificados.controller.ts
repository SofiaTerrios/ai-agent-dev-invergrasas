import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoDto } from './dto/create-certificado.dto';

@Controller('api/certificados')
@UseGuards(JwtAuthGuard)
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post('analisis')
  async createAnalisis(@Body() dto: CreateCertificadoDto) {
    return this.certificadosService.createAnalisis(dto);
  }
}
