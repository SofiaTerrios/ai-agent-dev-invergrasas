import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import type { AuthUser } from './request.util';

const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

export type AccessTokenPayload = {
  sub: string;
  email?: string;
  nombre?: string;
  rol?: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const optionalString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

// Reads the user from an `Authorization: Bearer <token>` header value.
export function userFromAuthHeader(header: unknown): AuthUser {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid token');
  }

  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(header.slice('Bearer '.length), JWT_SECRET);
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new UnauthorizedException('Invalid token');
  }

  return {
    id: decoded.sub,
    userId: decoded.sub,
    email: optionalString(decoded.email),
    nombre: optionalString(decoded.nombre),
    rol: optionalString(decoded.rol),
  };
}
