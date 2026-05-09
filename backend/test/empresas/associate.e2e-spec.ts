import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AssociateUserEmpresa (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let userId: string;
  let empresaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // 1. Create User -> userId
    const uniqueEmail = `test-${Date.now()}@invergrasas.com`;
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nombre: 'Test',
        email: uniqueEmail,
        password: 'password123',
        rol: 'admin',
      });
    userId = registerRes.body.id;

    // 2. Login User -> token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: 'password123' });
    token = loginRes.body.access_token;

    // 3. Create Empresa -> empresaId
    const uniqueNit = `NIT-${Date.now()}`;
    const createRes = await request(app.getHttpServer())
      .post('/api/empresas')
      .set('Authorization', `Bearer ${token}`)
      .send({ razon_social: 'Empresa Test', nit: uniqueNit });
    empresaId = createRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/empresas/:id/users (POST) should associate user and return 201', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/empresas/${empresaId}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty(
      'message',
      'Association created successfully',
    );
  });

  it('/api/empresas/:id/users (POST) should ignore duplicate silently and return 201', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/empresas/${empresaId}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Already associated');
  });

  it('/api/empresas/:id/users (POST) fails with 401 if missing token', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/empresas/${empresaId}/users`)
      .send({ userId });

    expect(res.status).toBe(401);
  });

  it('/api/empresas/:id/users (POST) fails with 404 for invalid user', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/empresas/${empresaId}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });

  it('/api/empresas/:id/users (POST) fails with 404 for invalid empresa', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/empresas/00000000-0000-0000-0000-000000000000/users`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId });

    expect(res.status).toBe(404);
  });

  it('/api/empresas (GET) should now list the associated empresa for the user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/empresas`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    const found = res.body.find((e: any) => e.id === empresaId);
    expect(found).toBeDefined();
  });
});
