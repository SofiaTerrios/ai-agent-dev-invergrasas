import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload, MessagePayload, UserModel } from '../graphql/models';
import {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '../graphql/inputs';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './request.util';

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserModel)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input.nombre, input.email, input.password);
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

  // Any signed-in user; also clears debe_cambiar_password
  @Mutation(() => MessagePayload)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.authService.changePassword(
      user.id,
      input.password_actual,
      input.password_nueva,
    );
  }
}
