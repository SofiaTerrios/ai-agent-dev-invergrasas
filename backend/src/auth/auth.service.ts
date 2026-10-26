import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Role } from '../graphql/enums';
import { hashPassword, comparePasswords } from '../utils/hash';
import { PrismaService } from '../prisma/prisma.service';
import { signAccessToken } from './jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // Public self-registration: always an empleado without empresas. Other
  // roles and empresa links are given by a super admin (usuarios module).
  async register(nombre: string, email: string, password: string) {
    // email is unique at DB level, so soft-deleted users still hold it
    const existing = await this.prisma.user.findUnique({
      where: { email, deleted_at: undefined },
    });
    if (existing) throw new ConflictException('Email already registered');
    const hashed = await hashPassword(password);
    const saved = await this.prisma.user.create({
      data: { nombre, email, password: hashed, rol: Role.empleado },
    });
    return {
      id: saved.id,
      nombre: saved.nombre,
      email: saved.email,
      rol: saved.rol,
      debe_cambiar_password: saved.debe_cambiar_password,
      created_at: saved.created_at,
    };
  }

  // Deactivated users are soft-deleted, so they are not found here.
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const match = await comparePasswords(password, user.password);
    if (!match) return null;
    const { password: _password, ...rest } = user;
    return rest;
  }

  async changePassword(userId: string, actual: string, nueva: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario inactivo');
    if (!(await comparePasswords(actual, user.password))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    if (actual === nueva) {
      throw new BadRequestException(
        'La nueva contraseña debe ser distinta de la actual',
      );
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: await hashPassword(nueva),
        debe_cambiar_password: false,
      },
    });
    return { message: 'Contraseña actualizada' };
  }

  login(
    user: Pick<
      User,
      'id' | 'email' | 'nombre' | 'rol' | 'debe_cambiar_password'
    >,
  ) {
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
        debe_cambiar_password: user.debe_cambiar_password,
      },
    };
  }
}
