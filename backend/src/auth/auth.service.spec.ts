import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { hashPassword } from '../utils/hash';
import { Role } from '../graphql/enums';

describe('AuthService', () => {
  const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';
  let prisma: any;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(async ({ data }) => ({
          id: 'u1',
          created_at: new Date(),
          ...data,
        })),
        update: jest.fn(async ({ data }) => ({
          id: 'u1',
          nombre: 'T',
          email: 't@example.com',
          created_at: new Date(),
          ...data,
        })),
      },
    };
    service = new AuthService(prisma);
  });

  describe('register', () => {
    it('creates empleados without a token', async () => {
      const res = await service.register('T', 't@example.com', 'secret123');

      expect(res).toMatchObject({ email: 't@example.com', rol: Role.empleado });
      expect(res).not.toHaveProperty('password');
    });

    it('rejects other roles when the caller is not admin', async () => {
      await expect(
        service.register('T', 't@example.com', 'secret123', Role.admin),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.register('T', 't@example.com', 'secret123', Role.calidad, {
          rol: Role.comercial,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('lets an admin create users with any role', async () => {
      const res = await service.register(
        'T',
        't@example.com',
        'secret123',
        Role.calidad,
        {
          rol: Role.admin,
        },
      );

      expect(res.rol).toBe(Role.calidad);
    });

    it('throws on duplicate email, including soft-deleted users', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register('T', 'dup@example.com', 'secret123'),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'dup@example.com', deleted_at: undefined },
      });
    });
  });

  describe('updateRol', () => {
    it('changes the role of an existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      const res = await service.updateRol('u1', Role.comercial);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { rol: Role.comercial },
      });
      expect(res.rol).toBe(Role.comercial);
    });

    it('throws NotFound for unknown users', async () => {
      await expect(service.updateRol('nope', Role.admin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('validateUser returns null for non-existent user', async () => {
    await expect(service.validateUser('no@x.com', 'pass')).resolves.toBeNull();
  });

  it('validateUser returns the user without password for correct credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 't@example.com',
      password: await hashPassword('secret'),
      rol: Role.empleado,
    });

    const res = await service.validateUser('t@example.com', 'secret');

    expect(res).toMatchObject({ email: 't@example.com' });
    expect(res).not.toHaveProperty('password');
  });

  it('login returns a token with the user role', async () => {
    const out = await service.login({
      id: 'u1',
      nombre: 'T',
      email: 't@example.com',
      rol: Role.calidad,
    });

    const payload = jwt.verify(out.access_token, JWT_SECRET) as any;
    expect(payload).toMatchObject({ sub: 'u1', rol: 'calidad' });
  });
});
