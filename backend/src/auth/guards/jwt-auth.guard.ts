import jwt from 'jsonwebtoken';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req || context.switchToHttp().getRequest();
    
    if (!request || !request.headers) {
        throw new UnauthorizedException('No request found');
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      request.user = {
        userId: payload.sub,
        id: payload.sub,
        email: payload.email,
        nombre: payload.nombre,
        rol: payload.rol,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
