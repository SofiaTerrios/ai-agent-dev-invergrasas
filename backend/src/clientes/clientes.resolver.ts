import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import {
  ClienteConnection,
  ClienteModel,
  MessagePayload,
} from '../graphql/models';
import { PaginationArgs } from '../common/pagination';
import { ClientesByEmpresaArgs } from '../graphql/args';
import { CreateClienteInput, UpdateClienteInput } from '../graphql/inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PERMISOS } from '../auth/roles';

@Resolver(() => ClienteModel)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesResolver {
  constructor(private readonly clientesService: ClientesService) {}

  @Query(() => ClienteConnection)
  @Roles(...PERMISOS.clientes.leerTodos)
  async clientes(@Args() pagination: PaginationArgs) {
    return this.clientesService.findAll(pagination);
  }

  @Query(() => ClienteConnection)
  @Roles(...PERMISOS.clientes.leer)
  async clientesByEmpresa(
    @Args() { empresaId, ...pagination }: ClientesByEmpresaArgs,
  ) {
    return this.clientesService.findAllByEmpresa(empresaId, pagination);
  }

  @Mutation(() => ClienteModel)
  @Roles(...PERMISOS.clientes.escribir)
  async createCliente(@Args('input') input: CreateClienteInput) {
    return this.clientesService.create(input);
  }

  @Mutation(() => ClienteModel)
  @Roles(...PERMISOS.clientes.escribir)
  async updateCliente(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateClienteInput,
  ) {
    return this.clientesService.update(id, input);
  }

  @Mutation(() => MessagePayload)
  @Roles(...PERMISOS.clientes.escribir)
  async deleteCliente(@Args('id', { type: () => ID }) id: string) {
    await this.clientesService.remove(id);
    return { message: 'Cliente eliminado' };
  }
}
