import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import {
  ClienteConnection,
  ClienteModel,
  ContactoModel,
  MessagePayload,
  SedeModel,
} from '../graphql/models';
import { ClientesArgs, ClientesByEmpresaArgs } from '../graphql/args';
import {
  CreateClienteInput,
  CreateContactoInput,
  CreateSedeInput,
  UpdateClienteInput,
  UpdateContactoInput,
  UpdateSedeInput,
} from '../graphql/inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Resolver(() => ClienteModel)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesResolver {
  constructor(private readonly clientesService: ClientesService) {}

  @Query(() => ClienteConnection, {
    description: 'Clientes de las empresas del usuario',
  })
  @Permiso('clientes', 'leer')
  clientes(
    @Args() { first, after, ...filtros }: ClientesArgs,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.list(user, filtros, { first, after });
  }

  @Query(() => ClienteConnection)
  @Permiso('clientes', 'leer')
  clientesByEmpresa(
    @Args() { empresaId, first, after }: ClientesByEmpresaArgs,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.list(user, { empresaId }, { first, after });
  }

  @Query(() => ClienteModel)
  @Permiso('clientes', 'leer')
  cliente(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.findOne(user, id);
  }

  @Mutation(() => ClienteModel)
  @Permiso('clientes', 'escribir')
  createCliente(
    @Args('input') input: CreateClienteInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.create(user, input);
  }

  @Mutation(() => ClienteModel)
  @Permiso('clientes', 'escribir')
  updateCliente(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateClienteInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.update(user, id, input);
  }

  @Mutation(() => MessagePayload)
  @Permiso('clientes', 'escribir')
  async deleteCliente(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.clientesService.remove(user, id);
    return { message: 'Cliente eliminado' };
  }

  // ── Sedes (IG-37) ──

  @Query(() => [SedeModel])
  @Permiso('clientes', 'leer')
  sedes(
    @Args('clienteId', { type: () => ID }) clienteId: string,
    @Args('incluirInactivas', { nullable: true }) incluirInactivas: boolean,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.sedes(user, clienteId, incluirInactivas);
  }

  @Mutation(() => SedeModel)
  @Permiso('clientes', 'escribir')
  createSede(
    @Args('input') input: CreateSedeInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.createSede(user, input);
  }

  @Mutation(() => SedeModel)
  @Permiso('clientes', 'escribir')
  updateSede(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSedeInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.updateSede(user, id, input);
  }

  @Mutation(() => MessagePayload, { description: 'Desactiva la sede' })
  @Permiso('clientes', 'escribir')
  async deleteSede(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.clientesService.deleteSede(user, id);
    return { message: 'Sede desactivada' };
  }

  // ── Contactos (IG-38) ──

  @Query(() => [ContactoModel], {
    description: 'Contactos del cliente; primero los de la sede indicada',
  })
  @Permiso('clientes', 'leer')
  contactos(
    @Args('clienteId', { type: () => ID }) clienteId: string,
    @Args('sedeId', { type: () => ID, nullable: true }) sedeId: string,
    @Args('search', { nullable: true }) search: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.contactos(user, clienteId, sedeId, search);
  }

  @Mutation(() => ContactoModel)
  @Permiso('contactos', 'escribir')
  createContacto(
    @Args('input') input: CreateContactoInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.createContacto(user, input);
  }

  @Mutation(() => ContactoModel)
  @Permiso('contactos', 'escribir')
  updateContacto(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateContactoInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.clientesService.updateContacto(user, id, input);
  }

  @Mutation(() => MessagePayload, { description: 'Desactiva el contacto' })
  @Permiso('contactos', 'escribir')
  async deleteContacto(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.clientesService.deleteContacto(user, id);
    return { message: 'Contacto desactivado' };
  }
}
