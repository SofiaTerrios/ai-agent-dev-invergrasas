import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuarioConnection, UsuarioModel } from '../graphql/models';
import { UsuariosArgs } from '../graphql/args';
import { CreateUsuarioInput, UpdateUsuarioInput } from '../graphql/inputs';
import { Role } from '../graphql/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Resolver(() => UsuarioModel)
@UseGuards(JwtAuthGuard, RolesGuard)
@Permiso('usuarios', 'gestionar')
export class UsuariosResolver {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Query(() => UsuarioConnection)
  usuarios(@Args() args: UsuariosArgs) {
    return this.usuariosService.list(args);
  }

  @Query(() => UsuarioModel)
  usuario(@Args('id', { type: () => ID }) id: string) {
    return this.usuariosService.findOne(id);
  }

  // Loaded only when requested: the image can weigh up to 300 KB
  @ResolveField(() => String, {
    nullable: true,
    description: 'Imagen de la firma como data URL',
  })
  firma(@Parent() usuario: UsuarioModel) {
    return this.usuariosService.firma(usuario.id);
  }

  @Mutation(() => UsuarioModel)
  createUsuario(
    @Args('input') input: CreateUsuarioInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usuariosService.create(input, user);
  }

  @Mutation(() => UsuarioModel)
  updateUsuario(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUsuarioInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usuariosService.update(id, input, user);
  }

  @Mutation(() => UsuarioModel)
  updateUserRol(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('rol', { type: () => Role }) rol: Role,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usuariosService.updateRol(userId, rol, user);
  }

  @Mutation(() => UsuarioModel)
  desactivarUsuario(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usuariosService.desactivar(id, user);
  }

  @Mutation(() => UsuarioModel)
  reactivarUsuario(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usuariosService.reactivar(id, user);
  }

  @Mutation(() => UsuarioModel)
  restablecerPasswordUsuario(
    @Args('id', { type: () => ID }) id: string,
    @Args('password') password: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usuariosService.restablecerPassword(id, password, user);
  }
}
