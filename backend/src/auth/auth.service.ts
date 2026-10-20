import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Role } from '../graphql/enums';
import { hashPassword, comparePasswords } from '../utils/hash';
import { PrismaService } from '../prisma/prisma.service';
import { signAccessToken } from './jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(
    nombre: string,
    email: string,
    password: string,
    rol: Role = Role.empleado,
    actor?: { rol?: string },
  ) {
    // Self-registration only creates empleados; other roles need an admin
    if (rol !== Role.empleado && actor?.rol !== Role.admin) {
      throw new ForbiddenException(
        'Solo un administrador puede asignar ese rol',
      );
    }
    // email is unique at DB level, so soft-deleted users still hold it
    const existing = await this.prisma.user.findUnique({
      where: { email, deleted_at: undefined },
    });
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

  async updateRol(userId: string, rol: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const saved = await this.prisma.user.update({
      where: { id: userId },
      data: { rol },
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
    const { password: _password, ...rest } = user;
    return rest;
  }

  login(user: Pick<User, 'id' | 'email' | 'nombre' | 'rol'>) {
    const payload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };
    const token = signAccessToken(payload);
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
