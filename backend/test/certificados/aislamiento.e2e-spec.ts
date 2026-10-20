import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { rmSync } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2EApp, gql, tokenFor } from '../utils/e2e';

const CREATE = `
  mutation($input: CreateCertificadoInput!) {
    createCertificado(input: $input) { id archivo_url }
  }
`;
const LIST = `query { certificados { id empresa_id } }`;
const GET = `query($id: ID!) { certificado(id: $id) { id lote parametros { nombre } } }`;

describe('Certificados E2E - aislamiento por empresa', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let empresaA: string;
  let empresaB: string;
  let clienteB: string;
  let certificadoA: string;

  const input = (overrides: Record<string, unknown> = {}) => {
    const vence = new Date();
    vence.setDate(vence.getDate() + 30);
    return {
      tipo: 'rbd',
      empresa_id: empresaA,
      empresa_cliente: 'Cliente A',
      lote: 'L-001',
      peso_kg: 100,
      fecha_vencimiento: vence.toISOString().split('T')[0],
      parametros: {
        acidez: '0,07',
        humedad: '0,06',
        indice_yodo: '61,4',
        peroxido: '0,30',
        color_amarillo: '40,0',
        color_rojo: '3,0',
      },
      ...overrides,
    };
  };

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());

    const [a, b] = await Promise.all(
      ['A', 'B'].map((x) =>
        prisma.empresa.create({ data: { razon_social: `Empresa ${x}`, nit: `CERT-${x}` } }),
      ),
    );
    empresaA = a.id;
    empresaB = b.id;
    clienteB = (
      await prisma.cliente.create({
        data: {
          nombre: 'Cliente B',
          contacto: 'x',
          telefono: '1',
          correo: 'b@test.com',
          empresa_id: empresaB,
        },
      })
    ).id;

    const makeUser = async (x: string, empresaId: string) => {
      const user = await prisma.user.create({
        data: {
          nombre: `Calidad ${x}`,
          email: `calidad-${x}@test.com`,
          password: 'x',
          rol: 'calidad',
        },
      });
      await prisma.userEmpresa.create({
        data: { user_id: user.id, empresa_id: empresaId },
      });
      return tokenFor(user);
    };
    tokenA = await makeUser('a', empresaA);
    tokenB = await makeUser('b', empresaB);

    const res = await gql(app, tokenA, CREATE, { input: input() });
    expect(res.body.errors).toBeUndefined();
    certificadoA = res.body.data.createCertificado.id;
    expect(res.body.data.createCertificado.archivo_url).toBe(
      `/api/certificados/${certificadoA}/pdf`,
    );
  });

  afterAll(async () => {
    const files = await prisma.certificadoAnalisis.findMany({
      where: { deleted_at: undefined },
      select: { archivo_url: true },
    });
    for (const { archivo_url } of files) {
      if (archivo_url) {
        rmSync(path.join(process.cwd(), 'static', 'certificados', path.basename(archivo_url)), {
          force: true,
        });
      }
    }
    await app.close();
  });

  it('stores the empresa of the certificado', async () => {
    const row = await prisma.certificadoAnalisis.findUniqueOrThrow({
      where: { id: certificadoA },
    });
    expect(row.empresa_id).toBe(empresaA);
  });

  it('does not let a user generate certificados for another empresa', async () => {
    const res = await gql(app, tokenA, CREATE, { input: input({ empresa_id: empresaB }) });
    expect(res.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('rejects a cliente from another empresa', async () => {
    const res = await gql(app, tokenA, CREATE, { input: input({ cliente_id: clienteB }) });
    expect(res.body.errors?.[0]?.message).toBe('El cliente no pertenece a la empresa');
  });

  it('lists only the certificados of the user empresa', async () => {
    const resA = await gql(app, tokenA, LIST);
    expect(resA.body.data.certificados).toEqual([{ id: certificadoA, empresa_id: empresaA }]);

    const resB = await gql(app, tokenB, LIST);
    expect(resB.body.data.certificados).toEqual([]);
  });

  it('does not expose a certificado of another empresa', async () => {
    const own = await gql(app, tokenA, GET, { id: certificadoA });
    expect(own.body.data.certificado.lote).toBe('L-001');
    expect(own.body.data.certificado.parametros).toHaveLength(6);

    const other = await gql(app, tokenB, GET, { id: certificadoA });
    expect(other.body.errors?.[0]?.message).toBe('Certificado no encontrado');
  });

  it('only lets users of the same empresa download the PDF', async () => {
    const url = `/api/certificados/${certificadoA}/pdf`;

    const own = await request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(own.headers['content-type']).toBe('application/pdf');

    await request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
    await request(app.getHttpServer()).get(url).expect(401);
  });
});
