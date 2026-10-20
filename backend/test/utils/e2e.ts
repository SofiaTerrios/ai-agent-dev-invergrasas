import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

// Runs against the real Postgres pointed to by DATABASE_URL (with migrations applied).
// Each suite starts from empty tables.

const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

export async function createE2EApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  return { app, prisma };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE parametros_analisis, certificados_analisis, pedidos, clientes, user_empresas, empresas, users CASCADE',
  );
}

export function tokenFor(user: {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}) {
  return jwt.sign(
    { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export function gql(
  app: INestApplication,
  token: string | null,
  query: string,
  variables?: Record<string, unknown>,
) {
  const req = request(app.getHttpServer()).post('/graphql');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send({ query, variables });
}
