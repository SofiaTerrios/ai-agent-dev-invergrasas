import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload, UserModel } from '../graphql/models';
import { LoginInput, RegisterInput } from '../graphql/inputs';
import { Role } from '../graphql/enums';
import { getUserFromContext } from '../graphql/graphql-auth';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PERMISOS } from './roles';

type GqlContext = Parameters<typeof getUserFromContext>[0];

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserModel)
  async register(
    @Args('input') input: RegisterInput,
    @Context() context: GqlContext,
  ) {
    return this.authService.register(
      input.nombre,
      input.email,
      input.password,
      input.rol,
      optionalUser(context),
    );
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput) {
    const user = await this.authService.validateUser(
      input.email,
      input.password,
    );
    if (!user) throw new UnauthorizedException('Credenciales invalidas');
    return this.authService.login(user);
  }

  @Mutation(() => UserModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...PERMISOS.usuarios.asignarRol)
  async updateUserRol(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('rol', { type: () => Role }) rol: Role,
  ) {
    return this.authService.updateRol(userId, rol);
  }
}

// Registration is public: the token is only used when present
function optionalUser(context: GqlContext) {
  try {
    return getUserFromContext(context);
  } catch {
    return undefined;
  }
}
