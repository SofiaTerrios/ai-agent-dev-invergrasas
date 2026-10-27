import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { MessagePayload, VehiculoModel } from '../graphql/models';
import { CreateVehiculoInput, UpdateVehiculoInput } from '../graphql/inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Resolver(() => VehiculoModel)
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiculosResolver {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Query(() => [VehiculoModel])
  @Permiso('vehiculos', 'leer')
  vehiculos(
    @Args('empresaId', { type: () => ID, nullable: true }) empresaId: string,
    @Args('transportadorId', { type: () => ID, nullable: true })
    transportadorId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiculosService.list(user, empresaId, transportadorId);
  }

  @Mutation(() => VehiculoModel)
  @Permiso('vehiculos', 'escribir')
  createVehiculo(
    @Args('input') input: CreateVehiculoInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiculosService.create(user, input);
  }

  @Mutation(() => VehiculoModel)
  @Permiso('vehiculos', 'escribir')
  updateVehiculo(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVehiculoInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiculosService.update(user, id, input);
  }

  @Mutation(() => MessagePayload)
  @Permiso('vehiculos', 'escribir')
  async deleteVehiculo(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.vehiculosService.remove(user, id);
    return { message: 'Vehículo eliminado' };
  }

  @Mutation(() => VehiculoModel, {
    nullable: true,
    description: 'Vehículo que se precarga para el conductor; null lo quita',
  })
  @Permiso('vehiculos', 'escribir')
  asignarVehiculoPorDefecto(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('vehiculoId', { type: () => ID, nullable: true })
    vehiculoId: string | null,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vehiculosService.asignarPorDefecto(user, userId, vehiculoId);
  }
}
