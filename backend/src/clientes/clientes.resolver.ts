import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClientesService } from './clientes.service';
import {
  ClienteConnection,
  ClienteModel,
  MessagePayload,
} from '../graphql/models';
import { PaginationArgs } from '../common/pagination';
import { ClientesByEmpresaArgs } from '../graphql/args';
import { CreateClienteInput, UpdateClienteInput } from '../graphql/inputs';
import { getUserFromContext } from '../graphql/graphql-auth';

@Resolver(() => ClienteModel)
export class ClientesResolver {
  constructor(private readonly clientesService: ClientesService) {}

  @Query(() => ClienteConnection)
  async clientes(@Args() pagination: PaginationArgs, @Context() context: any) {
    const user = getUserFromContext(context);
    // Admins see all clientes, others cannot access this query
    if (user.rol !== 'admin') {
      throw new Error('Only admins can view all clients');
    }
    return this.clientesService.findAll(pagination);
  }

  @Query(() => ClienteConnection)
  async clientesByEmpresa(
    @Args() { empresaId, ...pagination }: ClientesByEmpresaArgs,
    @Context() context: any,
  ) {
    getUserFromContext(context);
    return this.clientesService.findAllByEmpresa(empresaId, pagination);
  }

  @Mutation(() => ClienteModel)
  async createCliente(
    @Args('input') input: CreateClienteInput,
    @Context() context: any,
  ) {
    getUserFromContext(context);
    return this.clientesService.create(input);
  }

  @Mutation(() => ClienteModel)
  async updateCliente(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateClienteInput,
    @Context() context: any,
  ) {
    getUserFromContext(context);
    return this.clientesService.update(id, input);
  }

  @Mutation(() => MessagePayload)
  async deleteCliente(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any,
  ) {
    getUserFromContext(context);
    await this.clientesService.remove(id);
    return { message: 'Cliente eliminado' };
  }
}
