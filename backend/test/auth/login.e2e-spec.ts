import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import authController from '../../src/auth/auth.controller';
import { AppDataSource } from '../../src/data-source';

describe('Auth E2E', () => {
  let app: express.Express;

  beforeAll(async () => {
    app = express();
    app.use(bodyParser.json());
    // mount auth router at /api/auth
    app.use('/api/auth', authController as any);
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('registers and logs in successfully', async () => {
    const user = { nombre: 'Test', email: 'test@example.com', password: 'secret', rol: 'empleado' };
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('access_token');
    expect(login.body).toHaveProperty('user');
  });

  it('returns 401 for wrong password', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'wrong' });
    expect(login.status).toBe(401);
  });

  it('returns 401 for non-existent email', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'noone@example.com', password: 'whatever' });
    expect(login.status).toBe(401);
  });
});
