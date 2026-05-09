import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EmpresasService } from './empresas.service';
import { EmpresaModel, MessagePayload } from '../graphql/models';
import { CreateEmpresaInput, UpdateEmpresaInput } from '../graphql/inputs';
import { getUserFromContext } from '../graphql/graphql-auth';

@Resolver(() => EmpresaModel)
export class EmpresasResolver {
  constructor(private readonly empresasService: EmpresasService) {}

  @Query(() => [EmpresaModel])
  async empresas(@Context() context: any) {
    const user = getUserFromContext(context);
    // Admins see all empresas, other users see only their associated empresas
    if (user.rol === 'admin') {
      return this.empresasService.findAll();
    }
    return this.empresasService.findAllForUser(user.id);
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
