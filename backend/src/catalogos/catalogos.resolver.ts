import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import {
  ActividadEconomicaModel,
  CiudadModel,
  MessagePayload,
  ProductoModel,
  TipoEmpaqueModel,
} from '../graphql/models';
import {
  ProductoInput,
  TipoEmpaqueInput,
  UpdateProductoInput,
  UpdateTipoEmpaqueInput,
} from '../graphql/inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogosResolver {
  constructor(private readonly catalogos: CatalogosService) {}

  @Query(() => [CiudadModel], {
    description: 'Municipios de Colombia; busca sin importar tildes',
  })
  @Permiso('catalogos', 'leer')
  ciudades(
    @Args('search', { nullable: true }) search?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
  ) {
    return this.catalogos.ciudades(search, first);
  }

  @Query(() => [ActividadEconomicaModel])
  @Permiso('catalogos', 'leer')
  actividadesEconomicas() {
    return this.catalogos.actividades();
  }

  @Mutation(() => ActividadEconomicaModel)
  @Permiso('catalogos', 'gestionarActividades')
  createActividadEconomica(@Args('nombre') nombre: string) {
    return this.catalogos.createActividad(nombre);
  }

  @Mutation(() => ActividadEconomicaModel)
  @Permiso('catalogos', 'gestionarActividades')
  updateActividadEconomica(
    @Args('id', { type: () => ID }) id: string,
    @Args('nombre') nombre: string,
  ) {
    return this.catalogos.updateActividad(id, nombre);
  }

  @Mutation(() => MessagePayload)
  @Permiso('catalogos', 'gestionarActividades')
  async deleteActividadEconomica(@Args('id', { type: () => ID }) id: string) {
    await this.catalogos.deleteActividad(id);
    return { message: 'Actividad eliminada' };
  }

  @Query(() => [ProductoModel])
  @Permiso('catalogos', 'leer')
  productos() {
    return this.catalogos.productos();
  }

  @Mutation(() => ProductoModel)
  @Permiso('catalogos', 'gestionarProductos')
  createProducto(@Args('input') input: ProductoInput) {
    return this.catalogos.createProducto(input);
  }

  @Mutation(() => ProductoModel)
  @Permiso('catalogos', 'gestionarProductos')
  updateProducto(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductoInput,
  ) {
    return this.catalogos.updateProducto(id, input);
  }

  @Mutation(() => MessagePayload)
  @Permiso('catalogos', 'gestionarProductos')
  async deleteProducto(@Args('id', { type: () => ID }) id: string) {
    await this.catalogos.deleteProducto(id);
    return { message: 'Producto eliminado' };
  }

  @Mutation(() => ProductoModel, {
    description: 'Reemplaza los empaques válidos del producto',
  })
  @Permiso('catalogos', 'gestionarProductos')
  setEmpaquesProducto(
    @Args('productoId', { type: () => ID }) productoId: string,
    @Args('tipoEmpaqueIds', { type: () => [ID] }) tipoEmpaqueIds: string[],
  ) {
    return this.catalogos.setEmpaquesProducto(productoId, tipoEmpaqueIds);
  }

  @Query(() => [TipoEmpaqueModel])
  @Permiso('catalogos', 'leer')
  tiposEmpaque() {
    return this.catalogos.tiposEmpaque();
  }

  @Mutation(() => TipoEmpaqueModel)
  @Permiso('catalogos', 'gestionarProductos')
  createTipoEmpaque(@Args('input') input: TipoEmpaqueInput) {
    return this.catalogos.createTipoEmpaque(input);
  }

  @Mutation(() => TipoEmpaqueModel)
  @Permiso('catalogos', 'gestionarProductos')
  updateTipoEmpaque(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTipoEmpaqueInput,
  ) {
    return this.catalogos.updateTipoEmpaque(id, input);
  }

  @Mutation(() => MessagePayload)
  @Permiso('catalogos', 'gestionarProductos')
  async deleteTipoEmpaque(@Args('id', { type: () => ID }) id: string) {
    await this.catalogos.deleteTipoEmpaque(id);
    return { message: 'Empaque eliminado' };
  }
}
