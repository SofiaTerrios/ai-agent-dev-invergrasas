import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2EApp } from '../utils/e2e';

describe('Auth E2E - register', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register creates an empleado', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nombre: 'E2E',
        email: 'e2e@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      email: 'e2e@example.com',
      rol: 'empleado',
    });
    expect(res.body).not.toHaveProperty('password');
    const row = await prisma.user.findUniqueOrThrow({
      where: { email: 'e2e@example.com' },
    });
    expect(row.password).not.toBe('password123');
  });

  it('returns 409 for a duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nombre: 'E2E',
        email: 'e2e@example.com',
        password: 'password123',
      })
      .expect(409);
  });

  it('returns 400 for invalid data', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ nombre: '', email: 'not-an-email', password: '1' })
      .expect(400);
  });
});
