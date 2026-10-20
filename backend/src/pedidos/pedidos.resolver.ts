import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PedidosService } from './pedidos.service';
import { PedidoConnection, PedidoModel } from '../graphql/models';
import { PedidosArgs } from '../graphql/args';
import { CreatePedidoInput, UpdatePedidoInput } from '../graphql/inputs';
import { getUserFromContext } from '../graphql/graphql-auth';

@Resolver(() => PedidoModel)
export class PedidosResolver {
  constructor(private readonly pedidosService: PedidosService) {}

  @Query(() => PedidoConnection)
  async pedidos(
    @Args() { filters = {}, ...pagination }: PedidosArgs,
    @Context() context: any,
  ) {
    const user = getUserFromContext(context);
    return this.pedidosService.listForUser(user.id, filters, pagination);
  }

  @Mutation(() => PedidoModel)
  async createPedido(
    @Args('input') input: CreatePedidoInput,
    @Context() context: any,
  ) {
    const user = getUserFromContext(context);
    return this.pedidosService.create(input, user.id);
  }

  @Mutation(() => PedidoModel)
  async updatePedido(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePedidoInput,
    @Context() context: any,
  ) {
    const user = getUserFromContext(context);
    return this.pedidosService.update(id, input, {
      id: user.id,
      rol: user.rol,
    });
  }
}
