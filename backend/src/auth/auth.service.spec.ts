import { AuthService } from './auth.service';
import { hashPassword } from '../utils/hash';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let service: AuthService;
  const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

  beforeAll(async () => {});

  it('validateUser returns null for non-existent user', async () => {
    const repo: any = { findOne: async () => null };
    service = new AuthService(repo);
    const res = await service.validateUser('no@x.com', 'pass');
    expect(res).toBeNull();
  });

  it('validateUser returns user for correct credentials', async () => {
    const hashed = await hashPassword('secret');
    const user = { id: 'u1', nombre: 'T', email: 't@example.com', password: hashed, rol: 'empleado' } as any;
    const repo: any = { findOne: async () => user };
    service = new AuthService(repo);
    const res = await service.validateUser('t@example.com', 'secret');
    expect(res).toBeTruthy();
    expect((res as any).email).toBe('t@example.com');
  });

  it('login returns token and user', async () => {
    const repo: any = { findOne: async () => null };
    service = new AuthService(repo);
    const out = await service.login({ id: 'u1', nombre: 'T', email: 't@example.com', rol: 'empleado' });
    expect(out).toHaveProperty('access_token');
    expect(out).toHaveProperty('user');
    const payload = jwt.verify(out.access_token, JWT_SECRET) as any;
    expect(payload.email).toBe('t@example.com');
  });
});
