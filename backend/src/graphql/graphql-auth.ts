import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

export type CurrentUser = {
  id: string;
  email?: string;
  nombre?: string;
  rol?: string;
};

export function getUserFromContext(context: { req?: { headers?: any } }) {
  const authHeader = context.req?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid token');
  }

  try {
    const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
    return {
      id: payload.sub,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
    } satisfies CurrentUser;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}
