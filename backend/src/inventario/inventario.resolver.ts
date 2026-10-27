import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { MovimientoInventarioModel, SaldoEnvaseModel } from '../graphql/models';
import { AjusteInventarioInput } from '../graphql/inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioResolver {
  constructor(private readonly inventario: InventarioService) {}

  @Query(() => [SaldoEnvaseModel], {
    description: 'Envases retornables en cada cliente (saldo distinto de 0)',
  })
  @Permiso('inventario', 'leer')
  inventarioEnvases(
    @Args('empresaId', { type: () => ID, nullable: true }) empresaId: string,
    @Args('clienteId', { type: () => ID, nullable: true }) clienteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventario.saldos(user, empresaId, clienteId);
  }

  @Query(() => [MovimientoInventarioModel], {
    description: 'Últimos movimientos de envases del cliente',
  })
  @Permiso('inventario', 'leer')
  historialEnvases(
    @Args('clienteId', { type: () => ID }) clienteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventario.historial(user, clienteId);
  }

  @Mutation(() => [SaldoEnvaseModel], {
    description: 'Saldo inicial o corrección, con motivo',
  })
  @Permiso('inventario', 'ajustar')
  ajustarInventario(
    @Args('input') input: AjusteInventarioInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inventario.ajustar(user, input);
  }
}
