import { BadRequestException, ConflictException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { hashPassword } from '../utils/hash';
import { Role } from '../graphql/enums';
import { PrismaService } from '../prisma/prisma.service';

type UserData = Record<string, unknown>;

const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(({ data }: { data: UserData }) =>
      Promise.resolve({ id: 'u1', created_at: new Date(), ...data }),
    ),
    update: jest.fn(({ data }: { data: UserData }) =>
      Promise.resolve({
        id: 'u1',
        nombre: 'T',
        email: 't@example.com',
        created_at: new Date(),
        ...data,
      }),
    ),
  },
});

describe('AuthService', () => {
  const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AuthService(prisma as unknown as PrismaService);
  });

  describe('register', () => {
    it('creates empleados without a token', async () => {
      const res = await service.register('T', 't@example.com', 'secret123');

      expect(res).toMatchObject({ email: 't@example.com', rol: Role.empleado });
      expect(res).not.toHaveProperty('password');
    });

    it('always creates empleados that must not change password', async () => {
      await service.register('T', 't@example.com', 'secret123');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ rol: Role.empleado }) as unknown,
      });
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

  describe('changePassword', () => {
    beforeEach(async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        password: await hashPassword('actual123'),
      });
    });

    it('saves the new password and clears debe_cambiar_password', async () => {
      await service.changePassword('u1', 'actual123', 'nueva123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          password: expect.any(String) as unknown,
          debe_cambiar_password: false,
        },
      });
    });

    it('rejects a wrong current password', async () => {
      await expect(
        service.changePassword('u1', 'otra', 'nueva123'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password', async () => {
      await expect(
        service.changePassword('u1', 'actual123', 'actual123'),
      ).rejects.toThrow(BadRequestException);
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

  it('login returns a token with the user role', () => {
    const out = service.login({
      id: 'u1',
      nombre: 'T',
      email: 't@example.com',
      rol: Role.calidad,
      debe_cambiar_password: true,
    });

    expect(out.user.debe_cambiar_password).toBe(true);
    const payload = jwt.verify(out.access_token, JWT_SECRET);
    expect(payload).toMatchObject({ sub: 'u1', rol: 'calidad' });
  });
});
