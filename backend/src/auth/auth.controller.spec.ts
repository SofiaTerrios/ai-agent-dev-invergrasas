import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

describe('AuthService (unit with DB)', () => {
  let authService: AuthService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [AuthService],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it('registers a user and returns public profile', async () => {
    const res = await authService.register(
      'Test',
      't@example.com',
      'password123',
      'empleado',
    );
    expect(res).toHaveProperty('id');
    expect(res.email).toBe('t@example.com');
  });

  it('throws on duplicate email', async () => {
    await authService.register(
      'A',
      'dup@example.com',
      'password123',
      'empleado',
    );
    await expect(
      authService.register('B', 'dup@example.com', 'password456', 'empleado'),
    ).rejects.toThrow('EMAIL_EXISTS');
  });
});
