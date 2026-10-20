import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EmpresasService } from './empresas.service';
import {
  EmpresaConnection,
  EmpresaModel,
  MessagePayload,
} from '../graphql/models';
import { PaginationArgs } from '../common/pagination';
import { CreateEmpresaInput, UpdateEmpresaInput } from '../graphql/inputs';
import { getUserFromContext } from '../graphql/graphql-auth';

@Resolver(() => EmpresaModel)
export class EmpresasResolver {
  constructor(private readonly empresasService: EmpresasService) {}

  @Query(() => EmpresaConnection)
  async empresas(@Args() pagination: PaginationArgs, @Context() context: any) {
    const user = getUserFromContext(context);
    // Admins see all empresas, other users see only their associated empresas
    return this.empresasService.list(user, pagination);
  }

  @Mutation(() => EmpresaModel)
  async createEmpresa(@Args('input') input: CreateEmpresaInput) {
    return this.empresasService.create(input);
  }

  @Mutation(() => EmpresaModel)
  async updateEmpresa(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmpresaInput,
  ) {
    return this.empresasService.update(id, input);
  }

  @Mutation(() => MessagePayload)
  async associateUserToEmpresa(
    @Args('empresaId', { type: () => ID }) empresaId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Context() context: any,
  ) {
    getUserFromContext(context);
    return this.empresasService.associateUserToEmpresa(empresaId, userId);
  }
}
