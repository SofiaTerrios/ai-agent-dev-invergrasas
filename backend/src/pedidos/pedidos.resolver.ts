import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PedidoConnection, PedidoModel } from '../graphql/models';
import { PedidosArgs } from '../graphql/args';
import { CreatePedidoInput, UpdatePedidoInput } from '../graphql/inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { PERMISOS } from '../auth/roles';

@Resolver(() => PedidoModel)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PedidosResolver {
  constructor(private readonly pedidosService: PedidosService) {}

  @Query(() => PedidoConnection)
  @Roles(...PERMISOS.pedidos.leer)
  async pedidos(
    @Args() { filters = {}, ...pagination }: PedidosArgs,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pedidosService.listForUser(user, filters, pagination);
  }

  @Mutation(() => PedidoModel)
  @Roles(...PERMISOS.pedidos.escribir)
  async createPedido(
    @Args('input') input: CreatePedidoInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pedidosService.create(input, user);
  }

  @Mutation(() => PedidoModel)
  @Roles(...PERMISOS.pedidos.escribir)
  async updatePedido(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePedidoInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pedidosService.update(id, input, {
      id: user.id,
      rol: user.rol,
    });
  }
}
