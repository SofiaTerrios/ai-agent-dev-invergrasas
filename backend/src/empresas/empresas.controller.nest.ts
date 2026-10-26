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
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Controller('api/empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @Permiso('empresas', 'crear')
  async create(@Body() dto: CreateEmpresaDto) {
    return this.empresasService.create(dto);
  }

  @Put(':id')
  @Permiso('empresas', 'editar')
  async update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresasService.update(id, dto);
  }

  @Get()
  @Permiso('empresas', 'leer')
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() pagination: PaginationArgs,
  ) {
    return this.empresasService.list(user, pagination);
  }

  @Post(':id/users')
  @Permiso('usuarios', 'gestionar')
  async associateUser(
    @Param('id') empresaId: string,
    @Body() dto: AssociateUserDto,
  ) {
    return this.empresasService.associateUserToEmpresa(empresaId, dto.userId);
  }
}
