import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PaginationArgs } from '../common/pagination';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { AssociateUserDto } from './dto/associate-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { PERMISOS } from '../auth/roles';

@Controller('api/empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @Roles(...PERMISOS.empresas.escribir)
  async create(@Body() dto: CreateEmpresaDto) {
    return this.empresasService.create(dto);
  }

  @Put(':id')
  @Roles(...PERMISOS.empresas.escribir)
  async update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresasService.update(id, dto);
  }

  @Get()
  @Roles(...PERMISOS.empresas.leer)
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() pagination: PaginationArgs,
  ) {
    return this.empresasService.list(user, pagination);
  }

  @Post(':id/users')
  @Roles(...PERMISOS.empresas.escribir)
  async associateUser(
    @Param('id') empresaId: string,
    @Body() dto: AssociateUserDto,
  ) {
    return this.empresasService.associateUserToEmpresa(empresaId, dto.userId);
  }
}
