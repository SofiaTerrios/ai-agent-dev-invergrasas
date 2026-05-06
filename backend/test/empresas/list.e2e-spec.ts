import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import empresasRouter from '../../src/empresas/empresas.controller';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/users/entities/user.entity';
import { Empresa } from '../../src/empresas/entities/empresa.entity';
import { UserEmpresa } from '../../src/empresas/entities/user-empresa.entity';
import jwt from 'jsonwebtoken';

describe('Empresas list E2E', () => {
  let app: express.Express;
  const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();
    app = express();
    app.use(bodyParser.json());
    app.use('/api/empresas', empresasRouter as any);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('returns only empresas assigned to user', async () => {
    const userRepo = AppDataSource.getRepository(User);
    const empresaRepo = AppDataSource.getRepository(Empresa);
    const ueRepo = AppDataSource.getRepository(UserEmpresa);

    const user = userRepo.create({ nombre: 'U1', email: 'u1@example.com', password: 'x', rol: 'empleado' } as any);
    await userRepo.save(user);

    const e1 = empresaRepo.create({ razon_social: 'A', nit: 'n1' } as any);
    const e2 = empresaRepo.create({ razon_social: 'B', nit: 'n2' } as any);
    const e3 = empresaRepo.create({ razon_social: 'C', nit: 'n3' } as any);
    await empresaRepo.save([e1, e2, e3]);

    await ueRepo.save({ user_id: user.id, empresa_id: e1.id } as any);
    await ueRepo.save({ user_id: user.id, empresa_id: e2.id } as any);

    const token = jwt.sign({ sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol }, JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app).get('/api/empresas').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const nits = res.body.map((r: any) => r.nit).sort();
    expect(nits).toEqual(['n1', 'n2']);
  });

  it('returns empty array for user with no empresas', async () => {
    const userRepo = AppDataSource.getRepository(User);
    const user = userRepo.create({ nombre: 'U2', email: 'u2@example.com', password: 'x', rol: 'empleado' } as any);
    await userRepo.save(user);
    const token = jwt.sign({ sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/empresas').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 401 for unauthenticated', async () => {
    const res = await request(app).get('/api/empresas');
    expect(res.status).toBe(401);
  });
});
