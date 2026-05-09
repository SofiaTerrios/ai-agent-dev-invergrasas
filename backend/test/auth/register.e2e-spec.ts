import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('Auth Register (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register success', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nombre: 'E2E',
        email: 'e2e@example.com',
        password: 'password123',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
