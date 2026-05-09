import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Role } from '../graphql/enums';
import { hashPassword, comparePasswords } from '../utils/hash';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(
    nombre: string,
    email: string,
    password: string,
    rol: Role = Role.empleado,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const hashed = await hashPassword(password);
    const saved = await this.prisma.user.create({
      data: { nombre, email, password: hashed, rol },
    });
    return {
      id: saved.id,
      nombre: saved.nombre,
      email: saved.email,
      rol: saved.rol,
      created_at: saved.created_at,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const match = await comparePasswords(password, user.password);
    if (!match) return null;
    const { password: _p, ...rest } = user as any;
    return rest as Omit<User, 'password'>;
  }

  async login(user: Partial<User>) {
    const payload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    return {
      access_token: token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    };
  }
}
