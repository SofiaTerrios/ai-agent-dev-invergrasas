import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Prisma, Rol } from '@prisma/client';
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
    'TRUNCATE TABLE configuracion, audit_logs, parametros_analisis, certificados_analisis, inventario_envases, movimiento_lineas, movimientos, secuencias_movimiento, vehiculos, contactos, sedes, clientes, user_empresas, empresas, users CASCADE',
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

export type GqlError = { message: string; extensions?: { code?: string } };
export type GqlResponse<T> = { data: T; errors?: GqlError[] };

export async function gql<T = unknown>(
  app: INestApplication,
  token: string | null,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GqlResponse<T>> {
  const req = request(app.getHttpServer()).post('/graphql');
  if (token) req.set('Authorization', `Bearer ${token}`);
  const res = await req.send({ query, variables });
  return res.body as GqlResponse<T>;
}

export async function createUser(
  prisma: PrismaService,
  rol: Rol,
  empresaIds: string[] = [],
) {
  const user = await prisma.user.create({
    data: {
      nombre: `Usuario ${rol}`,
      email: `${rol}-${randomUUID()}@e2e.test`,
      password: 'x',
      rol,
    },
  });
  for (const empresa_id of empresaIds) {
    await prisma.userEmpresa.create({ data: { user_id: user.id, empresa_id } });
  }
  return { user, token: tokenFor(user) };
}

export function createEmpresa(
  prisma: PrismaService,
  nit: string = randomUUID(),
) {
  return prisma.empresa.create({
    data: { razon_social: `Empresa ${nit}`, nit },
  });
}

// Cliente with its principal sede, as created from the dashboard
export function createCliente(
  prisma: PrismaService,
  empresa_id: string,
  data: Partial<Prisma.ClienteUncheckedCreateInput> = {},
) {
  return prisma.cliente.create({
    data: {
      razon_social: `Cliente ${randomUUID()}`,
      empresa_id,
      sedes: { create: { nombre: 'Principal', principal: true } },
      ...data,
    },
  });
}

// Ciudad loaded by the migration (DIVIPOLA)
export function ciudad(prisma: PrismaService, codigoDane = '11001') {
  return prisma.ciudad.findUniqueOrThrow({
    where: { codigo_dane: codigoDane },
  });
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// 1x1 transparent PNG, valid for pdfkit
export const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Creates the user who signs certificados (with a signature image) and sets
// her as firmante, as the super admin would.
export async function configurarFirmante(prisma: PrismaService) {
  const firmante = await prisma.user.create({
    data: {
      nombre: 'Adriana Rodriguez Urrea',
      email: `firmante-${randomUUID()}@e2e.test`,
      password: 'x',
      rol: 'calidad',
      firma: Buffer.from(PNG_BASE64, 'base64'),
      firma_mime: 'image/png',
    },
  });
  await prisma.configuracion.upsert({
    where: { clave: 'certificados.firmante_id' },
    create: { clave: 'certificados.firmante_id', valor: firmante.id },
    update: { valor: firmante.id },
  });
  return firmante;
}
