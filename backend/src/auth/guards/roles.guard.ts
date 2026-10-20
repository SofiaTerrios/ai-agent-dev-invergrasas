import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../graphql/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { getRequest } from '../request.util';

// Works for REST and GraphQL. Must run after JwtAuthGuard, which sets request.user.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles || roles.length === 0) return true;

    const user = getRequest(context).user;
    if (!user) throw new UnauthorizedException('Missing or invalid token');
    if (!roles.includes(user.rol as Role)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
