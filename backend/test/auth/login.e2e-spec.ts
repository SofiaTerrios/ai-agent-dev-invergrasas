import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2EApp } from '../utils/e2e';

describe('Auth E2E - login', () => {
  let app: INestApplication;
  const user = {
    nombre: 'Test',
    email: 'test@example.com',
    password: 'secret123',
  };

  beforeAll(async () => {
    ({ app } = await createE2EApp());
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in successfully', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    expect(login.body).toHaveProperty('access_token');
    expect(login.body).toHaveProperty('user');
    expect((login.body as { user: unknown }).user).toMatchObject({
      email: user.email,
      rol: 'empleado',
    });
  });

  it('returns 401 for wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong' })
      .expect(401);
  });

  it('returns 401 for non-existent email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'noone@example.com', password: 'whatever' })
      .expect(401);
  });
});
