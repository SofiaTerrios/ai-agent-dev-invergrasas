import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MovimientosService } from './movimientos.service';
import { TextosService } from './textos.service';
import {
  ConductorModel,
  MovimientoConnection,
  MovimientoModel,
  TextoCertificadorModel,
} from '../graphql/models';
import { MovimientosArgs } from '../graphql/args';
import { CreateMovimientoInput } from '../graphql/inputs';
import { TipoMovimiento } from '../graphql/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Resolver(() => MovimientoModel)
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovimientosResolver {
  constructor(
    private readonly movimientosService: MovimientosService,
    private readonly textos: TextosService,
  ) {}

  @Query(() => MovimientoConnection, {
    description: 'Entregas y recolecciones; el rol entrega solo ve las suyas',
  })
  @Permiso('movimientos', 'leer')
  movimientos(
    @Args() { first, after, ...filtros }: MovimientosArgs,
    @CurrentUser() user: AuthUser,
  ) {
    return this.movimientosService.list(user, filtros, { first, after });
  }

  @Query(() => MovimientoModel)
  @Permiso('movimientos', 'leer')
  movimiento(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.movimientosService.findOne(user, id);
  }

  @Mutation(() => MovimientoModel, {
    description: 'Emite el movimiento: consecutivo, PDF e inventario',
  })
  @Permiso('movimientos', 'crear')
  createMovimiento(
    @Args('input') input: CreateMovimientoInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.movimientosService.create(user, input);
  }

  @Mutation(() => MovimientoModel)
  @Permiso('movimientos', 'anular')
  anularMovimiento(
    @Args('id', { type: () => ID }) id: string,
    @Args('motivo') motivo: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.movimientosService.anular(user, id, motivo);
  }

  @Query(() => [ConductorModel], {
    description: 'Conductores que puede elegir el usuario al emitir',
  })
  @Permiso('movimientos', 'crear')
  conductores(
    @Args('empresaId', { type: () => ID }) empresaId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.movimientosService.conductores(user, empresaId);
  }

  @Query(() => [TextoCertificadorModel])
  @Permiso('movimientos', 'leer')
  textosCertificador() {
    return this.textos.todos();
  }

  @Mutation(() => TextoCertificadorModel)
  @Permiso('movimientos', 'configurarTextos')
  actualizarTextoCertificador(
    @Args('tipo', { type: () => TipoMovimiento }) tipo: TipoMovimiento,
    @Args('texto') texto: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.textos.actualizar(tipo, texto, user);
  }
}
