import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISO_KEY, PermisoRequerido } from '../decorators/permiso.decorator';
import { Accion, puede } from '../roles';
import { getRequest } from '../request.util';

// Works for REST and GraphQL. Must run after JwtAuthGuard, which sets request.user.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permiso = this.reflector.getAllAndOverride<
      PermisoRequerido | undefined
    >(PERMISO_KEY, [context.getHandler(), context.getClass()]);
    if (!permiso) return true;

    const user = getRequest(context).user;
    if (!user) throw new UnauthorizedException('Missing or invalid token');
    const accion = permiso.accion as Accion<typeof permiso.modulo>;
    if (!puede(user.rol, permiso.modulo, accion)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
