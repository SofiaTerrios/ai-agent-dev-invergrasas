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
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Resolver(() => EmpresaModel)
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasResolver {
  constructor(private readonly empresasService: EmpresasService) {}

  @Query(() => EmpresaConnection)
  @Permiso('empresas', 'leer')
  async empresas(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: AuthUser,
  ) {
    // Admins see all empresas, other users see only their associated empresas
    return this.empresasService.list(user, pagination);
  }

  @Mutation(() => EmpresaModel)
  @Permiso('empresas', 'crear')
  async createEmpresa(@Args('input') input: CreateEmpresaInput) {
    return this.empresasService.create(input);
  }

  @Mutation(() => EmpresaModel)
  @Permiso('empresas', 'editar')
  async updateEmpresa(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmpresaInput,
  ) {
    return this.empresasService.update(id, input);
  }

  @Mutation(() => MessagePayload)
  @Permiso('usuarios', 'gestionar')
  async associateUserToEmpresa(
    @Args('empresaId', { type: () => ID }) empresaId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.empresasService.associateUserToEmpresa(empresaId, userId);
  }
}
