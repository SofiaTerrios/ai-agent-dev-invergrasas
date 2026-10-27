import { INestApplication } from '@nestjs/common';
import { mkdtempSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  PNG_BASE64,
  createE2EApp,
  createEmpresa,
  createUser,
  gql,
} from '../utils/e2e';

const CREATE = `
  mutation($input: CreateCertificadoInput!) { createCertificado(input: $input) { id } }
`;
const FIRMANTE = `query { firmanteCertificados { id nombre tiene_firma } }`;
const ASIGNAR = `
  mutation($userId: ID!) { asignarFirmanteCertificados(userId: $userId) { id nombre } }
`;
const ANULAR = `
  mutation($id: ID!, $motivo: String!) {
    anularCertificado(id: $id, motivo: $motivo) {
      id anulado motivo_anulacion anulado_por_nombre
    }
  }
`;
const GET = `
  query($id: ID!) {
    certificado(id: $id) {
      id firmado_por anulado reemplaza_id reemplazado_por_id
      empresa { razon_social }
      parametros { clave nombre valor }
    }
  }
`;
const LIST = `
  query($tipo: CertificadoTipo, $busqueda: String) {
    certificados(tipo: $tipo, busqueda: $busqueda) {
      totalCount
      edges { node { id lote anulado } }
    }
  }
`;

type Certificado = {
  id: string;
  firmado_por: string;
  anulado: boolean;
  reemplaza_id: string | null;
  reemplazado_por_id: string | null;
  empresa: { razon_social: string };
  parametros: { clave: string; nombre: string; valor: string }[];
};

describe('Certificados E2E - firmante, anulación y reemisión', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let empresaId: string;
  let superToken: string;
  let adminToken: string;
  let calidadToken: string;
  let calidadOtraToken: string;
  let comercialToken: string;
  let adrianaId: string;
  const pdfDir = mkdtempSync(path.join(tmpdir(), 'certificados-'));

  const input = (overrides: Record<string, unknown> = {}) => {
    const vence = new Date();
    vence.setDate(vence.getDate() + 30);
    return {
      tipo: 'rbd',
      empresa_id: empresaId,
      empresa_cliente: 'Yoko Snacks',
      nit_cliente: '901.486.714',
      lote: 'L-100',
      peso_kg: 2977.5,
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

  const crear = async (overrides: Record<string, unknown> = {}) => {
    const res = await gql<{ createCertificado: { id: string } }>(
      app,
      calidadToken,
      CREATE,
      { input: input(overrides) },
    );
    expect(res.errors).toBeUndefined();
    return res.data.createCertificado.id;
  };

  const obtener = async (id: string) =>
    (await gql<{ certificado: Certificado }>(app, calidadToken, GET, { id }))
      .data.certificado;

  beforeAll(async () => {
    process.env.CERTIFICADOS_DIR = pdfDir;
    ({ app, prisma } = await createE2EApp());
    empresaId = (await createEmpresa(prisma)).id;
    const otra = (await createEmpresa(prisma)).id;
    superToken = (await createUser(prisma, 'super_admin')).token;
    adminToken = (await createUser(prisma, 'admin')).token;
    calidadToken = (await createUser(prisma, 'calidad', [empresaId])).token;
    calidadOtraToken = (await createUser(prisma, 'calidad', [otra])).token;
    comercialToken = (await createUser(prisma, 'comercial', [empresaId])).token;
    adrianaId = (
      await prisma.user.create({
        data: {
          nombre: 'Adriana Rodriguez Urrea',
          email: 'adriana@e2e.test',
          password: 'x',
          rol: 'calidad',
        },
      })
    ).id;
  });

  afterAll(async () => {
    rmSync(pdfDir, { recursive: true, force: true });
    delete process.env.CERTIFICADOS_DIR;
    await app.close();
  });

  describe('firmante', () => {
    it('does not generate anything while there is no firmante', async () => {
      const res = await gql(app, calidadToken, CREATE, { input: input() });

      expect(res.errors?.[0]?.message).toMatch(/No hay firmante/);
      expect(await prisma.certificadoAnalisis.count()).toBe(0);
      expect(readdirSync(pdfDir)).toEqual([]);
    });

    it('requires a signature image', async () => {
      const res = await gql(app, superToken, ASIGNAR, { userId: adrianaId });
      expect(res.errors?.[0]?.message).toMatch(/imagen de firma/);
    });

    it('can only be set by the super admin, and is audited', async () => {
      await prisma.user.update({
        where: { id: adrianaId },
        data: {
          firma: Buffer.from(PNG_BASE64, 'base64'),
          firma_mime: 'image/png',
        },
      });

      const denied = await gql(app, adminToken, ASIGNAR, { userId: adrianaId });
      expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const ok = await gql(app, superToken, ASIGNAR, { userId: adrianaId });
      expect(ok.errors).toBeUndefined();
      expect(
        await prisma.auditLog.count({
          where: { accion: 'certificados.cambiar_firmante' },
        }),
      ).toBe(1);

      const firmante = await gql<{
        firmanteCertificados: { id: string; tiene_firma: boolean };
      }>(app, comercialToken, FIRMANTE);
      expect(firmante.data.firmanteCertificados).toMatchObject({
        id: adrianaId,
        tiene_firma: true,
      });
    });

    it('keeps the signer of issued certificados when her data changes', async () => {
      const id = await crear();
      await prisma.user.update({
        where: { id: adrianaId },
        data: { nombre: 'Otro Nombre' },
      });

      const certificado = await obtener(id);
      expect(certificado.firmado_por).toBe('Adriana Rodriguez Urrea');
      expect(certificado.empresa.razon_social).toMatch(/^Empresa/);
      expect(certificado.parametros[0]).toEqual({
        clave: 'acidez',
        nombre: 'Acidez (%)',
        valor: '0,07',
      });
      const row = await prisma.certificadoAnalisis.findUniqueOrThrow({
        where: { id },
      });
      expect(row.firmante_id).toBe(adrianaId);

      await prisma.user.update({
        where: { id: adrianaId },
        data: { nombre: 'Adriana Rodriguez Urrea' },
      });
    });
  });

  describe('anular y reemitir', () => {
    let anuladoId: string;

    beforeAll(async () => {
      anuladoId = await crear({ lote: 'L-ERROR' });
    });

    it('only lets admin and calidad of the empresa annul', async () => {
      const comercial = await gql(app, comercialToken, ANULAR, {
        id: anuladoId,
        motivo: 'Lote equivocado',
      });
      expect(comercial.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const otraEmpresa = await gql(app, calidadOtraToken, ANULAR, {
        id: anuladoId,
        motivo: 'Lote equivocado',
      });
      expect(otraEmpresa.errors?.[0]?.message).toBe(
        'Certificado no encontrado',
      );
    });

    it('requires a reason', async () => {
      const res = await gql(app, calidadToken, ANULAR, {
        id: anuladoId,
        motivo: ' ',
      });
      expect(res.errors?.[0]?.message).toMatch(/motivo/);
    });

    it('annuls it, keeps it in the history and audits it', async () => {
      const res = await gql<{
        anularCertificado: {
          anulado: boolean;
          motivo_anulacion: string;
          anulado_por_nombre: string;
        };
      }>(app, calidadToken, ANULAR, {
        id: anuladoId,
        motivo: 'Lote equivocado',
      });

      expect(res.data.anularCertificado).toMatchObject({
        anulado: true,
        motivo_anulacion: 'Lote equivocado',
        anulado_por_nombre: 'Usuario calidad',
      });
      const list = await gql<{
        certificados: { edges: { node: { id: string; anulado: boolean } }[] };
      }>(app, calidadToken, LIST);
      expect(list.data.certificados.edges).toContainEqual({
        node: { id: anuladoId, lote: 'L-ERROR', anulado: true },
      });
      expect(
        await prisma.auditLog.count({
          where: { accion: 'certificado.anular', entidad_id: anuladoId },
        }),
      ).toBe(1);

      const again = await gql(app, calidadToken, ANULAR, {
        id: anuladoId,
        motivo: 'Lote equivocado',
      });
      expect(again.errors?.[0]?.message).toMatch(/ya está anulado/);
    });

    it('reissues the anulado certificado only once', async () => {
      const nuevoId = await crear({ lote: 'L-OK', reemplaza_id: anuladoId });

      expect((await obtener(nuevoId)).reemplaza_id).toBe(anuladoId);
      expect((await obtener(anuladoId)).reemplazado_por_id).toBe(nuevoId);

      const twice = await gql(app, calidadToken, CREATE, {
        input: input({ reemplaza_id: anuladoId }),
      });
      expect(twice.errors?.[0]?.message).toMatch(/ya fue reemitido/);
    });

    it('does not reissue a valid certificado', async () => {
      const vigente = await crear({ lote: 'L-VIGENTE' });
      const res = await gql(app, calidadToken, CREATE, {
        input: input({ reemplaza_id: vigente }),
      });
      expect(res.errors?.[0]?.message).toMatch(/anulado/);
    });
  });

  it('filters the history by tipo and by cliente, NIT or lote', async () => {
    await crear({
      tipo: 'oleina',
      lote: 'OL-7',
      empresa_cliente: 'Aceites del Sur',
      peso_kg: null,
      parametros: { ...input().parametros, punto_nube: '5,9' },
    });

    type List = {
      certificados: { totalCount: number; edges: { node: { lote: string } }[] };
    };
    const oleina = await gql<List>(app, calidadToken, LIST, {
      tipo: 'oleina',
    });
    expect(oleina.data.certificados.edges.map((e) => e.node.lote)).toEqual([
      'OL-7',
    ]);

    const busqueda = await gql<List>(app, calidadToken, LIST, {
      busqueda: 'del sur',
    });
    expect(busqueda.data.certificados.totalCount).toBe(1);
  });
});
