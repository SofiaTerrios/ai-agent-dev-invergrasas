import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { AssociateUserDto } from './dto/associate-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  async create(@Body() dto: CreateEmpresaDto) {
    return this.empresasService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresasService.update(id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req) {
    const userId = req.user.userId; // Extraído del token JWT
    return this.empresasService.findAllForUser(userId);
  }

  @Post(':id/users')
  @UseGuards(JwtAuthGuard)
  async associateUser(
    @Param('id') empresaId: string,
    @Body() dto: AssociateUserDto,
  ) {
    return this.empresasService.associateUserToEmpresa(empresaId, dto.userId);
  }
}
