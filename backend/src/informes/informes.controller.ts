import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TipoMovimiento } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { InformesService } from './informes.service';
import { hoyEnBogota } from '../movimientos/movimientos.service';

class FiltrosInformeDto {
  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsEnum(TipoMovimiento)
  tipo?: TipoMovimiento;

  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

@Controller('api/informes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InformesController {
  constructor(private readonly informes: InformesService) {}

  // Excel of entregas and recolecciones (IG-33)
  @Get('movimientos.xlsx')
  @Permiso('informes', 'exportar')
  async movimientos(
    @Query() filtros: FiltrosInformeDto,
    @CurrentUser() user: AuthUser,
  ) {
    const archivo = await this.informes.movimientosXlsx(user, filtros);
    return new StreamableFile(archivo, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="movimientos-${hoyEnBogota()}.xlsx"`,
    });
  }
}
