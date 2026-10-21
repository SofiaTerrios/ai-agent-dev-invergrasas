import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import type { AuthUser } from './request.util';

const DEV_SECRET = 'inver-secret';

// Read on use: .env is loaded by ConfigModule after this module is imported.
export function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_SECRET;
}

export type AccessTokenPayload = {
  sub: string;
  email?: string;
  nombre?: string;
  rol?: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, jwtSecret(), { expiresIn: '1h' });
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
    decoded = jwt.verify(header.slice('Bearer '.length), jwtSecret());
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
