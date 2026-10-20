import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getUserFromContext } from '../graphql/graphql-auth';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('api/auth')
export class AuthControllerNest {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto, @Req() req: Request) {
    let actor: { rol?: string } | undefined;
    try {
      actor = getUserFromContext({ req });
    } catch {
      // Registration is public: the token is only used when present
    }
    return this.authService.register(
      dto.nombre,
      dto.email,
      dto.password,
      dto.rol,
      actor,
    );
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) return { status: 401 };
    return this.authService.login(user);
  }

  @Get('profile')
  getProfile() {
    return { message: 'protected' };
  }
}
