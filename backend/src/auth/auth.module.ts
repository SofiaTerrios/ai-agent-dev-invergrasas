import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthControllerNest as AuthController } from './auth.controller.nest';
import { AuthResolver } from './auth.resolver';

@Module({
  providers: [AuthService, AuthResolver],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
