import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getRequest } from '../request.util';
import { userFromAuthHeader } from '../jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = getRequest(context);
    if (!request?.headers) {
      throw new UnauthorizedException('No request found');
    }

    const tokenUser = userFromAuthHeader(request.headers.authorization);
    // Deactivated users lose access at once, and role changes apply without
    // a new login: the role comes from the database, not the token.
    const user = await this.prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: { rol: true },
    });
    if (!user) throw new UnauthorizedException('Usuario inactivo');

    request.user = { ...tokenUser, rol: user.rol };
    return true;
  }
}
