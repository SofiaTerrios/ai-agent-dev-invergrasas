import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoDto } from './dto/create-certificado.dto';

@Controller('api/certificados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post('analisis')
  @Permiso('certificados', 'escribir')
  async createAnalisis(
    @Body() dto: CreateCertificadoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.certificadosService.createAnalisis(dto, user);
  }

  @Get(':id/pdf')
  @Permiso('certificados', 'leer')
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const filePath = await this.certificadosService.getPdfPath(user, id);
    return new StreamableFile(createReadStream(filePath), {
      type: 'application/pdf',
      disposition: `inline; filename="certificado-${id}.pdf"`,
    });
  }
}
