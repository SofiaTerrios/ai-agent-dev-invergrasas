import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  PNG_BASE64,
  ciudad,
  createE2EApp,
  createEmpresa,
  createUser,
  gql,
} from '../utils/e2e';

const CAMPOS = `
  id numero numero_formateado tipo fecha anulado motivo_anulacion total_kg archivo_url
  usuario_entrega { id nombre }
  snapshot {
    cliente { razon_social nit dv }
    sede { nombre direccion actividad ciudad }
    contacto { nombre cargo }
    conductor { nombre }
    vehiculo { placa }
    transportador { razon_social }
    texto
  }
  lineas { producto { nombre } cantidad unidad_medida tipo_empaque { nombre } cantidad_envases vacios_recibidos }
`;
const CREATE = `mutation($input: CreateMovimientoInput!) { createMovimiento(input: $input) { ${CAMPOS} } }`;
const LIST = `query($clienteId: ID) { movimientos(clienteId: $clienteId, first: 100) { totalCount edges { node { id numero usuario_entrega { nombre } } } } }`;
const GET = `query($id: ID!) { movimiento(id: $id) { ${CAMPOS} } }`;
const ANULAR = `mutation($id: ID!, $motivo: String!) { anularMovimiento(id: $id, motivo: $motivo) { id anulado motivo_anulacion } }`;
const SALDOS = `query($clienteId: ID) { inventarioEnvases(clienteId: $clienteId) { cliente { razon_social } tipo_empaque { nombre } saldo } }`;
const AJUSTAR = `mutation($input: AjusteInventarioInput!) { ajustarInventario(input: $input) { saldo } }`;
const TEXTO = `mutation($tipo: TipoMovimiento!, $texto: String!) { actualizarTextoCertificador(tipo: $tipo, texto: $texto) { texto } }`;

type Movimiento = {
  id: string;
  numero: number;
  numero_formateado: string;
  tipo: string;
  anulado: boolean;
  total_kg: number;
  archivo_url: string;
  usuario_entrega: { id: string; nombre: string };
  snapshot: {
    cliente: { razon_social: string; nit: string; dv: string };
    sede: {
      nombre: string;
      direccion: string;
      actividad: string;
      ciudad: string;
    };
    contacto: { nombre: string; cargo: string } | null;
    conductor: { nombre: string };
    vehiculo: { placa: string } | null;
    transportador: { razon_social: string } | null;
    texto: string;
  };
  lineas: { cantidad_envases: number; vacios_recibidos: number }[];
};

describe('Movimientos E2E - entregas, recolecciones e inventario', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const pdfDir = mkdtempSync(path.join(tmpdir(), 'movimientos-'));
  const t = {} as Record<
    'super' | 'admin' | 'comercial' | 'pedro' | 'juan' | 'calidad',
    string
  >;
  let empresaId: string;
  let pedroId: string;
  let juanId: string;
  let clienteId: string;
  let sedeId: string;
  let contactoId: string;
  let transportadorId: string;
  let vehiculoId: string;
  let rbd: string;
  let oleina: string;
  let caneca: string;
  let galon: string;
  let granel: string;

  const entrega = (overrides: Record<string, unknown> = {}) => ({
    empresa_id: empresaId,
    tipo: 'ENTREGA',
    fecha: '2026-10-20',
    cliente_id: clienteId,
    sede_id: sedeId,
    contacto_id: contactoId,
    vehiculo_id: vehiculoId,
    transportador_id: transportadorId,
    destino_id: transportadorId,
    lineas: [
      {
        producto_id: rbd,
        unidad_medida: 'kg',
        cantidad: '1.200,5'.replace('.', ''),
        tipo_empaque_id: caneca,
        cantidad_envases: 10,
      },
    ],
    ...overrides,
  });

  const recoleccion = (
    vacios: number,
    overrides: Record<string, unknown> = {},
  ) =>
    entrega({
      tipo: 'RECOLECCION',
      lineas: [{ tipo_empaque_id: caneca, vacios_recibidos: vacios }],
      ...overrides,
    });

  const crear = async (token: string, input: Record<string, unknown>) => {
    const res = await gql<{ createMovimiento: Movimiento }>(
      app,
      token,
      CREATE,
      {
        input,
      },
    );
    expect(res.errors).toBeUndefined();
    return res.data.createMovimiento;
  };

  const saldo = async (token = t.comercial) => {
    const res = await gql<{
      inventarioEnvases: { tipo_empaque: { nombre: string }; saldo: number }[];
    }>(app, token, SALDOS, { clienteId });
    return (
      res.data.inventarioEnvases.find((s) => s.tipo_empaque.nombre === 'Caneca')
        ?.saldo ?? 0
    );
  };

  beforeAll(async () => {
    process.env.MOVIMIENTOS_DIR = pdfDir;
    ({ app, prisma } = await createE2EApp());
    empresaId = (await createEmpresa(prisma)).id;
    const firma = {
      firma: Buffer.from(PNG_BASE64, 'base64'),
      firma_mime: 'image/png',
    };
    t.super = (await createUser(prisma, 'super_admin')).token;
    t.admin = (await createUser(prisma, 'admin')).token;
    t.comercial = (await createUser(prisma, 'comercial', [empresaId])).token;
    t.calidad = (await createUser(prisma, 'calidad', [empresaId])).token;
    const pedro = await createUser(prisma, 'entrega', [empresaId]);
    const juan = await createUser(prisma, 'entrega', [empresaId]);
    t.pedro = pedro.token;
    t.juan = juan.token;
    pedroId = pedro.user.id;
    juanId = juan.user.id;
    await prisma.user.update({
      where: { id: pedroId },
      data: { ...firma, nombre: 'Pedro' },
    });
    await prisma.user.update({
      where: { id: juanId },
      data: { ...firma, nombre: 'Juan' },
    });

    const bogota = (await ciudad(prisma)).id;
    const cliente = await prisma.cliente.create({
      data: {
        razon_social: 'Panadería La Espiga',
        nit: '800197268',
        dv: '4',
        empresa_id: empresaId,
        ciudad_id: bogota,
        sedes: {
          create: {
            nombre: 'Espiga Calle 109',
            direccion: 'Calle 109 # 15-20',
            ciudad_id: bogota,
            principal: true,
          },
        },
        contactos: {
          create: { nombre: 'Adolfo García', cargo: 'Jefe de Producción' },
        },
      },
      include: { sedes: true, contactos: true },
    });
    clienteId = cliente.id;
    sedeId = cliente.sedes[0].id;
    contactoId = cliente.contactos[0].id;
    const invergrasas = await prisma.cliente.create({
      data: {
        razon_social: 'Invergrasas SAS',
        nit: '901684306',
        empresa_id: empresaId,
        tipos: ['TRANSPORTADOR', 'DESTINO'],
      },
    });
    transportadorId = invergrasas.id;
    vehiculoId = (
      await prisma.vehiculo.create({
        data: {
          empresa_id: empresaId,
          transportador_id: transportadorId,
          placa: 'ABC 123',
        },
      })
    ).id;
    const id = async (nombre: string, modelo: 'producto' | 'tipoEmpaque') =>
      modelo === 'producto'
        ? (await prisma.producto.findUniqueOrThrow({ where: { nombre } })).id
        : (await prisma.tipoEmpaque.findUniqueOrThrow({ where: { nombre } }))
            .id;
    rbd = await id('Aceite de palma RBD', 'producto');
    oleina = await id('Oleína de palma', 'producto');
    caneca = await id('Caneca', 'tipoEmpaque');
    galon = await id('Galón', 'tipoEmpaque');
    granel = await id('Granel', 'tipoEmpaque');
  });

  afterAll(async () => {
    await prisma.configuracion.deleteMany({
      where: { clave: { startsWith: 'movimientos.' } },
    });
    rmSync(pdfDir, { recursive: true, force: true });
    delete process.env.MOVIMIENTOS_DIR;
    await app.close();
  });

  describe('emitir', () => {
    let primero: Movimiento;

    beforeAll(async () => {
      primero = await crear(t.pedro, entrega());
    });

    it('numbers, snapshots and signs with the conductor', () => {
      expect(primero).toMatchObject({
        numero: 1,
        numero_formateado: '001-2026',
        tipo: 'ENTREGA',
        total_kg: 1200.5,
        usuario_entrega: { id: pedroId, nombre: 'Pedro' },
        snapshot: {
          cliente: {
            razon_social: 'Panadería La Espiga',
            nit: '800197268',
            dv: '4',
          },
          sede: {
            nombre: 'Espiga Calle 109',
            direccion: 'Calle 109 # 15-20',
            ciudad: 'Bogotá, D.C.',
          },
          contacto: { nombre: 'Adolfo García', cargo: 'Jefe de Producción' },
          conductor: { nombre: 'Pedro' },
          vehiculo: { placa: 'ABC 123' },
          transportador: { razon_social: 'Invergrasas SAS' },
        },
      });
      expect(primero.snapshot.texto).toMatch(/certifica que/);
    });

    it('serves the PDF only with a token', async () => {
      const res = await request(app.getHttpServer())
        .get(primero.archivo_url)
        .set('Authorization', `Bearer ${t.comercial}`)
        .expect(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain(
        'certificado-001-2026.pdf',
      );
      await request(app.getHttpServer()).get(primero.archivo_url).expect(401);
    });

    it('generates the PDF on demand when missing (migrated pedidos)', async () => {
      await prisma.movimiento.update({
        where: { id: primero.id },
        data: { archivo_url: null },
      });
      await request(app.getHttpServer())
        .get(primero.archivo_url)
        .set('Authorization', `Bearer ${t.pedro}`)
        .expect(200);
      const row = await prisma.movimiento.findUniqueOrThrow({
        where: { id: primero.id },
      });
      expect(row.archivo_url).toBe(`mov-${primero.id}.pdf`);
    });

    it('keeps the snapshot when the sede changes later', async () => {
      await prisma.sede.update({
        where: { id: sedeId },
        data: { direccion: 'Nueva dirección' },
      });
      const res = await gql<{ movimiento: Movimiento }>(app, t.comercial, GET, {
        id: primero.id,
      });
      expect(res.data.movimiento.snapshot.sede.direccion).toBe(
        'Calle 109 # 15-20',
      );
      await prisma.sede.update({
        where: { id: sedeId },
        data: { direccion: 'Calle 109 # 15-20' },
      });
    });

    it('lets the sede data be edited only for this certificado', async () => {
      const m = await crear(
        t.pedro,
        entrega({
          sede_datos: { direccion: 'Bodega trasera', actividad: 'Panadería' },
        }),
      );
      expect(m.snapshot.sede).toMatchObject({
        direccion: 'Bodega trasera',
        actividad: 'Panadería',
      });
      const sede = await prisma.sede.findUniqueOrThrow({
        where: { id: sedeId },
      });
      expect(sede.direccion).toBe('Calle 109 # 15-20');
    });
  });

  describe('validaciones', () => {
    const error = async (input: Record<string, unknown>, token = t.pedro) =>
      (await gql(app, token, CREATE, { input })).errors?.[0]?.message;

    it('by tipo', async () => {
      expect(
        await error(
          recoleccion(1, {
            lineas: [
              {
                producto_id: rbd,
                unidad_medida: 'kg',
                cantidad: '5',
                tipo_empaque_id: caneca,
              },
            ],
          }),
        ),
      ).toMatch(/recolección no se registra producto/);
      expect(
        await error(
          entrega({
            lineas: [{ tipo_empaque_id: caneca, vacios_recibidos: 2 }],
          }),
        ),
      ).toBe('Indica el producto entregado');
      expect(
        await error(
          entrega({
            tipo: 'ENTREGA_Y_RECOLECCION',
          }),
        ),
      ).toBe('Indica los envases vacíos recogidos');
    });

    it('date, product + envase and quantity', async () => {
      expect(await error(entrega({ fecha: '2099-01-01' }))).toBe(
        'La fecha no puede ser futura',
      );
      expect(
        await error(
          entrega({
            lineas: [
              {
                producto_id: rbd,
                unidad_medida: 'kg',
                cantidad: '5',
                tipo_empaque_id: galon,
              },
            ],
          }),
        ),
      ).toMatch(/no se entrega en ese envase/);
      expect(
        await error(
          entrega({
            lineas: [
              {
                producto_id: oleina,
                unidad_medida: 'kg',
                cantidad: 'diez',
                tipo_empaque_id: galon,
              },
            ],
          }),
        ),
      ).toMatch(/Cantidad inválida/);
    });

    it('entrega issues only in their own name; admin chooses the conductor', async () => {
      const res = await gql(app, t.pedro, CREATE, {
        input: entrega({ usuario_entrega_id: juanId }),
      });
      expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const m = await crear(t.admin, entrega({ usuario_entrega_id: juanId }));
      expect(m.usuario_entrega.nombre).toBe('Juan');
    });

    it('comercial and calidad cannot issue', async () => {
      for (const token of [t.comercial, t.calidad]) {
        const res = await gql(app, token, CREATE, { input: entrega() });
        expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      }
    });

    it('requires the conductor signature', async () => {
      await prisma.user.update({
        where: { id: juanId },
        data: { firma: null, firma_mime: null },
      });
      expect(await error(entrega(), t.juan)).toMatch(
        /no tiene imagen de firma/,
      );
      await prisma.user.update({
        where: { id: juanId },
        data: {
          firma: Buffer.from(PNG_BASE64, 'base64'),
          firma_mime: 'image/png',
        },
      });
    });
  });

  it('lists the conductores: all for admin, only themselves for entrega', async () => {
    const Q = `query($empresaId: ID!) { conductores(empresaId: $empresaId) { nombre tiene_firma } }`;
    type R = { conductores: { nombre: string }[] };
    const admin = await gql<R>(app, t.admin, Q, { empresaId });
    expect(admin.data.conductores.map((c) => c.nombre)).toEqual([
      'Juan',
      'Pedro',
    ]);
    const pedro = await gql<R>(app, t.pedro, Q, { empresaId });
    expect(pedro.data.conductores.map((c) => c.nombre)).toEqual(['Pedro']);
  });

  it('never gives the same number to concurrent emissions', async () => {
    const antes = await prisma.movimiento.count({
      where: { empresa_id: empresaId },
    });
    const creados = await Promise.all(
      Array.from({ length: 6 }, () =>
        gql<{ createMovimiento: Movimiento }>(app, t.pedro, CREATE, {
          input: entrega(),
        }),
      ),
    );
    expect(creados.map((r) => r.errors?.[0]?.message)).toEqual(
      creados.map(() => undefined),
    );
    const numeros = creados
      .map((r) => r.data.createMovimiento.numero)
      .sort((a, b) => a - b);
    expect(numeros).toEqual(Array.from({ length: 6 }, (_, i) => antes + i + 1));
  });

  it('shows entrega only their own movimientos; comercial sees all', async () => {
    type List = {
      movimientos: {
        totalCount: number;
        edges: { node: { usuario_entrega: { nombre: string } } }[];
      };
    };
    const pedro = await gql<List>(app, t.pedro, LIST);
    expect(
      pedro.data.movimientos.edges.every(
        (e) => e.node.usuario_entrega.nombre === 'Pedro',
      ),
    ).toBe(true);
    const comercial = await gql<List>(app, t.comercial, LIST);
    expect(comercial.data.movimientos.totalCount).toBeGreaterThan(
      pedro.data.movimientos.totalCount,
    );

    const deJuan = await prisma.movimiento.findFirstOrThrow({
      where: { usuario_entrega_id: juanId },
    });
    const res = await gql(app, t.pedro, GET, { id: deJuan.id });
    expect(res.errors?.[0]?.message).toBe('Movimiento no encontrado');
  });

  describe('inventario de envases', () => {
    it('10 canecas delivered and 4 collected leave 6 per delivery', async () => {
      const inicial = await saldo();
      await crear(t.pedro, entrega());
      expect(await saldo()).toBe(inicial + 10);
      await crear(t.pedro, recoleccion(4));
      expect(await saldo()).toBe(inicial + 6);
    });

    it('allows collecting more than the balance (warning is in the form)', async () => {
      const inicial = await saldo();
      await crear(t.pedro, recoleccion(inicial + 5));
      expect(await saldo()).toBe(-5);
    });

    it('annulling restores the balance; only the super admin can', async () => {
      const antes = await saldo();
      const m = await crear(t.pedro, entrega());
      expect(await saldo()).toBe(antes + 10);

      for (const token of [t.admin, t.pedro, t.comercial]) {
        const res = await gql(app, token, ANULAR, {
          id: m.id,
          motivo: 'Cliente equivocado',
        });
        expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      }
      const ok = await gql<{ anularMovimiento: { anulado: boolean } }>(
        app,
        t.super,
        ANULAR,
        { id: m.id, motivo: 'Cliente equivocado' },
      );
      expect(ok.data.anularMovimiento.anulado).toBe(true);
      expect(await saldo()).toBe(antes);

      const again = await gql(app, t.super, ANULAR, {
        id: m.id,
        motivo: 'Otra vez',
      });
      expect(again.errors?.[0]?.message).toMatch(/ya está anulado/);
      expect(
        await prisma.auditLog.count({
          where: { accion: 'movimiento.anular', entidad_id: m.id },
        }),
      ).toBe(1);
      // The number is not reused
      const siguiente = await crear(t.pedro, entrega());
      expect(siguiente.numero).toBe(m.numero + 1);
    });

    it('opening balance: super admin only, returnable envases only', async () => {
      const antes = await saldo();
      const denied = await gql(app, t.admin, AJUSTAR, {
        input: {
          cliente_id: clienteId,
          tipo_empaque_id: caneca,
          cantidad: 7,
          motivo: 'Saldo inicial',
        },
      });
      expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const granelRes = await gql(app, t.super, AJUSTAR, {
        input: {
          cliente_id: clienteId,
          tipo_empaque_id: granel,
          cantidad: 7,
          motivo: 'Saldo inicial',
        },
      });
      expect(granelRes.errors?.[0]?.message).toMatch(/retornables/);

      await gql(app, t.super, AJUSTAR, {
        input: {
          cliente_id: clienteId,
          tipo_empaque_id: caneca,
          cantidad: 7,
          motivo: 'Saldo inicial',
        },
      });
      expect(await saldo()).toBe(antes + 7);
    });
  });

  it('uses the certifying text set by the super admin, without changing old ones', async () => {
    const viejo = await crear(t.pedro, entrega());
    const denied = await gql(app, t.admin, TEXTO, {
      tipo: 'ENTREGA',
      texto: 'X',
    });
    expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    await gql(app, t.super, TEXTO, {
      tipo: 'ENTREGA',
      texto: 'Texto aprobado por el negocio.',
    });

    const nuevo = await crear(t.pedro, entrega());
    expect(nuevo.snapshot.texto).toBe('Texto aprobado por el negocio.');
    const res = await gql<{ movimiento: Movimiento }>(app, t.pedro, GET, {
      id: viejo.id,
    });
    expect(res.data.movimiento.snapshot.texto).not.toBe(
      'Texto aprobado por el negocio.',
    );
  });

  it('exports an Excel whose totals skip annulled movimientos', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/informes/movimientos.xlsx?clienteId=${clienteId}`)
      .set('Authorization', `Bearer ${t.comercial}`)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(res.body);

    const hoja = libro.getWorksheet('Movimientos')!;
    const lineas = await prisma.movimientoLinea.count({
      where: { movimiento: { cliente_id: clienteId } },
    });
    expect(hoja.rowCount - 1).toBe(lineas);
    const anuladas: number[] = [];
    hoja.eachRow((fila, n) => {
      if (n > 1 && fila.getCell(17).value === 'ANULADO') anuladas.push(n);
    });
    expect(anuladas.length).toBeGreaterThan(0);

    const kgVigentes = await prisma.movimientoLinea.aggregate({
      _sum: { cantidad: true },
      where: {
        unidad_medida: 'kg',
        movimiento: { cliente_id: clienteId, anulado_at: null },
      },
    });
    const resumen = libro.getWorksheet('Resumen')!;
    let total = 0;
    resumen.eachRow((fila) => {
      if (fila.getCell(1).value === 'Total')
        total = Number(fila.getCell(4).value);
    });
    expect(total).toBeCloseTo(kgVigentes._sum.cantidad!.toNumber(), 2);

    await request(app.getHttpServer())
      .get('/api/informes/movimientos.xlsx')
      .set('Authorization', `Bearer ${t.pedro}`)
      .expect(403);
  });
});
