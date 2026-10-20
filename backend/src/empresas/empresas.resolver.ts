import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import {
  EmpresaConnection,
  EmpresaModel,
  MessagePayload,
} from '../graphql/models';
import { PaginationArgs } from '../common/pagination';
import { CreateEmpresaInput, UpdateEmpresaInput } from '../graphql/inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { PERMISOS } from '../auth/roles';

@Resolver(() => EmpresaModel)
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasResolver {
  constructor(private readonly empresasService: EmpresasService) {}

  @Query(() => EmpresaConnection)
  @Roles(...PERMISOS.empresas.leer)
  async empresas(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: AuthUser,
  ) {
    // Admins see all empresas, other users see only their associated empresas
    return this.empresasService.list(user, pagination);
  }

  @Mutation(() => EmpresaModel)
  @Roles(...PERMISOS.empresas.escribir)
  async createEmpresa(@Args('input') input: CreateEmpresaInput) {
    return this.empresasService.create(input);
  }

  @Mutation(() => EmpresaModel)
  @Roles(...PERMISOS.empresas.escribir)
  async updateEmpresa(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmpresaInput,
  ) {
    return this.empresasService.update(id, input);
  }

  @Mutation(() => MessagePayload)
  @Roles(...PERMISOS.empresas.escribir)
  async associateUserToEmpresa(
    @Args('empresaId', { type: () => ID }) empresaId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.empresasService.associateUserToEmpresa(empresaId, userId);
  }
}
