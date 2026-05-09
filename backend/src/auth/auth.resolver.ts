import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload, UserModel } from '../graphql/models';
import { LoginInput, RegisterInput } from '../graphql/inputs';

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserModel)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(
      input.nombre,
      input.email,
      input.password,
      input.rol,
    );
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput) {
    const user = await this.authService.validateUser(input.email, input.password);
    if (!user) throw new UnauthorizedException('Credenciales invalidas');
    return this.authService.login(user);
  }
}
