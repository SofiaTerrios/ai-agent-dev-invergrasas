import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createCliente,
  createE2EApp,
  createEmpresa,
  createUser,
  gql,
} from '../utils/e2e';

const CREATE = `
  mutation($input: CreatePedidoInput!) {
    createPedido(input: $input) { id producto tipo_empaque cantidad_kg creado_por cliente { id } }
  }
`;

describe('Pedidos E2E - create', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let empresaId: string;
  let clienteId: string;

  const input = (overrides: Record<string, unknown> = {}) => ({
    empresa_id: empresaId,
    cliente_id: clienteId,
    producto: 'RBD',
    tipo_empaque: 'Granel',
    cantidad_kg: 100.5,
    fecha: '2026-02-01',
    ...overrides,
  });

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    empresaId = (await createEmpresa(prisma)).id;
    clienteId = (await createCliente(prisma, empresaId)).id;
    const created = await createUser(prisma, 'comercial', [empresaId]);
    token = created.token;
    userId = created.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates pedido with valid data', async () => {
    const res = await gql<{ createPedido: unknown }>(app, token, CREATE, {
      input: input(),
    });
    expect(res.errors).toBeUndefined();
    expect(res.data.createPedido).toMatchObject({
      producto: 'RBD',
      tipo_empaque: 'Granel',
      cantidad_kg: 100.5,
      creado_por: userId,
      cliente: { id: clienteId },
    });
  });

  it('returns NOT_FOUND for a non-existent empresa', async () => {
    const res = await gql(app, token, CREATE, {
      input: input({ empresa_id: '00000000-0000-4000-8000-000000000000' }),
    });
    expect(res.errors?.[0]?.message).toBe('Empresa not found');
  });

  it('returns NOT_FOUND for a non-existent cliente', async () => {
    const res = await gql(app, token, CREATE, {
      input: input({ cliente_id: '00000000-0000-4000-8000-000000000000' }),
    });
    expect(res.errors?.[0]?.message).toBe('Cliente not found');
  });

  it('rejects invalid enum values', async () => {
    const res = await gql(app, token, CREATE, {
      input: input({ producto: 'Aceite' }),
    });
    expect(res.errors).toBeDefined();
    expect(await prisma.pedido.count()).toBe(1);
  });

  it('requires authentication', async () => {
    const res = await gql(app, null, CREATE, { input: input() });
    expect(res.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
