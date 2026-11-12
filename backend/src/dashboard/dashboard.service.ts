import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  accessibleEmpresaIds,
  assertEmpresaAccess,
} from '../empresas/empresa-access';
import { puede } from '../auth/roles';
import { hoyEnBogota } from '../movimientos/movimientos.service';
import { InventarioService } from '../inventario/inventario.service';
import { calcularPeriodo } from './periodo';

type Actor = { id: string; rol?: string };

const TOP_CLIENTES = 5;

/**
 * Home of the dashboard (IG-42). Every figure is aggregated in SQL with the
 * same rules as the history and the Excel: the user's empresas, only their
 * own movimientos for roles without `verTodos` (entrega), and annulled
 * movimientos and certificados never count. Sections the role cannot see
 * come back null.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventario: InventarioService,
  ) {}

  async resumen(
    actor: Actor,
    empresaId?: string,
    desde?: string,
    hasta?: string,
  ) {
    if (empresaId) await assertEmpresaAccess(this.prisma, actor, empresaId);
    const periodo = calcularPeriodo(hoyEnBogota(), desde, hasta);
    const veMovimientos = puede(actor.rol, 'movimientos', 'leer');
    const veInventario = puede(actor.rol, 'inventario', 'leer');
    const veCertificados = puede(actor.rol, 'certificados', 'leer');

    const [movimientos, certificados, envases] = await Promise.all([
      veMovimientos ? this.seccionMovimientos(actor, empresaId, periodo) : null,
      veCertificados ? this.certificados(actor, empresaId, periodo) : null,
      veInventario ? this.envases(actor, empresaId) : null,
    ]);

    return {
      desde: periodo.desde,
      hasta: periodo.hasta,
      anterior_desde: periodo.anterior_desde,
      anterior_hasta: periodo.anterior_hasta,
      kg_entregados: movimientos?.kg ?? null,
      movimientos: movimientos?.conteo ?? null,
      serie_kg: movimientos?.serieKg ?? null,
      serie_envases: movimientos?.serieEnvases ?? null,
      certificados,
      envases: envases?.kpi ?? null,
      top_clientes_envases: envases?.top ?? null,
    };
  }

  // Movimientos the actor can see, as a SQL condition on alias m
  private async filtroMovimientos(actor: Actor, empresaId?: string) {
    const condiciones = [
      Prisma.sql`m.anulado_at IS NULL`,
      Prisma.sql`m.deleted_at IS NULL`,
      await this.filtroEmpresa(actor, empresaId, Prisma.raw('m.empresa_id')),
    ];
    if (!puede(actor.rol, 'movimientos', 'verTodos')) {
      condiciones.push(Prisma.sql`m.usuario_entrega_id = ${actor.id}`);
    }
    return Prisma.join(condiciones, ' AND ');
  }

  private async filtroEmpresa(
    actor: Actor,
    empresaId: string | undefined,
    columna: Prisma.Sql,
  ) {
    if (empresaId) return Prisma.sql`${columna} = ${empresaId}`;
    const ids = await accessibleEmpresaIds(this.prisma, actor);
    if (ids === null) return Prisma.sql`TRUE`;
    return ids.length
      ? Prisma.sql`${columna} IN (${Prisma.join(ids)})`
      : Prisma.sql`FALSE`;
  }

  private async seccionMovimientos(
    actor: Actor,
    empresaId: string | undefined,
    p: ReturnType<typeof calcularPeriodo>,
  ) {
    const filtro = await this.filtroMovimientos(actor, empresaId);
    const actual = Prisma.sql`m.fecha BETWEEN ${p.desde}::date AND ${p.hasta}::date`;
    const anterior = Prisma.sql`m.fecha BETWEEN ${p.anterior_desde}::date AND ${p.anterior_hasta}::date`;
    const inicioSerie = `${p.meses[0]}-01`;

    const [[kpis], kgPorMes, envasesPorMes] = await Promise.all([
      this.prisma.$queryRaw<
        {
          kg_actual: number;
          kg_anterior: number;
          mov_actual: number;
          mov_anterior: number;
          entregas: number;
          recolecciones: number;
        }[]
      >`
        SELECT
          COALESCE(SUM(l.cantidad) FILTER (WHERE l.unidad_medida = 'kg' AND ${actual}), 0)::float8 AS kg_actual,
          COALESCE(SUM(l.cantidad) FILTER (WHERE l.unidad_medida = 'kg' AND ${anterior}), 0)::float8 AS kg_anterior,
          COUNT(DISTINCT m.id) FILTER (WHERE ${actual})::int AS mov_actual,
          COUNT(DISTINCT m.id) FILTER (WHERE ${anterior})::int AS mov_anterior,
          COUNT(DISTINCT m.id) FILTER (WHERE ${actual} AND m.tipo <> 'RECOLECCION')::int AS entregas,
          COUNT(DISTINCT m.id) FILTER (WHERE ${actual} AND m.tipo <> 'ENTREGA')::int AS recolecciones
        FROM movimientos m
        LEFT JOIN movimiento_lineas l ON l.movimiento_id = m.id AND l.deleted_at IS NULL
        WHERE ${filtro}`,
      this.prisma.$queryRaw<{ mes: string; producto: string; kg: number }[]>`
        SELECT to_char(m.fecha, 'YYYY-MM') AS mes, p.nombre AS producto, SUM(l.cantidad)::float8 AS kg
        FROM movimientos m
        JOIN movimiento_lineas l ON l.movimiento_id = m.id AND l.deleted_at IS NULL
        JOIN productos p ON p.id = l.producto_id
        WHERE ${filtro} AND l.unidad_medida = 'kg'
          AND m.fecha BETWEEN ${inicioSerie}::date AND ${p.hasta}::date
        GROUP BY 1, 2
        ORDER BY 1, 2`,
      this.prisma.$queryRaw<
        { mes: string; entregados: number; recogidos: number }[]
      >`
        SELECT to_char(m.fecha, 'YYYY-MM') AS mes,
          SUM(l.cantidad_envases + l.vacios_entregados)::int AS entregados,
          SUM(l.vacios_recibidos)::int AS recogidos
        FROM movimientos m
        JOIN movimiento_lineas l ON l.movimiento_id = m.id AND l.deleted_at IS NULL
        JOIN tipos_empaque e ON e.id = l.tipo_empaque_id AND e.retornable
        WHERE ${filtro}
          AND m.fecha BETWEEN ${inicioSerie}::date AND ${p.hasta}::date
        GROUP BY 1`,
    ]);

    const envasesMes = new Map(envasesPorMes.map((f) => [f.mes, f]));
    return {
      kg: { actual: kpis.kg_actual, anterior: kpis.kg_anterior },
      conteo: {
        actual: kpis.mov_actual,
        anterior: kpis.mov_anterior,
        entregas: kpis.entregas,
        recolecciones: kpis.recolecciones,
      },
      serieKg: kgPorMes,
      serieEnvases: p.meses.map((mes) => ({
        mes,
        entregados: envasesMes.get(mes)?.entregados ?? 0,
        recogidos: envasesMes.get(mes)?.recogidos ?? 0,
      })),
    };
  }

  // Certificados de análisis issued (not annulled), by Colombian date
  private async certificados(
    actor: Actor,
    empresaId: string | undefined,
    p: ReturnType<typeof calcularPeriodo>,
  ) {
    const empresa = await this.filtroEmpresa(
      actor,
      empresaId,
      Prisma.raw('c.empresa_id'),
    );
    const fecha = Prisma.sql`(c.fecha_emision AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota')::date`;
    const [fila] = await this.prisma.$queryRaw<
      { actual: number; anterior: number }[]
    >`
      SELECT
        COUNT(*) FILTER (WHERE ${fecha} BETWEEN ${p.desde}::date AND ${p.hasta}::date)::int AS actual,
        COUNT(*) FILTER (WHERE ${fecha} BETWEEN ${p.anterior_desde}::date AND ${p.anterior_hasta}::date)::int AS anterior
      FROM certificados_analisis c
      WHERE ${empresa} AND c.anulado_at IS NULL AND c.deleted_at IS NULL`;
    return fila;
  }

  // Envases at the clientes now (positive balances) and who holds the most
  private async envases(actor: Actor, empresaId?: string) {
    const saldos = (await this.inventario.saldos(actor, empresaId)).filter(
      (s) => s.saldo > 0,
    );
    const porTipo = new Map<string, number>();
    const porCliente = new Map<
      string,
      {
        cliente: (typeof saldos)[number]['cliente'];
        total: number;
        detalle: string[];
      }
    >();
    for (const s of saldos) {
      porTipo.set(
        s.tipo_empaque.nombre,
        (porTipo.get(s.tipo_empaque.nombre) ?? 0) + s.saldo,
      );
      const actual = porCliente.get(s.cliente.id) ?? {
        cliente: s.cliente,
        total: 0,
        detalle: [],
      };
      actual.total += s.saldo;
      actual.detalle.push(`${s.saldo} ${s.tipo_empaque.nombre.toLowerCase()}`);
      porCliente.set(s.cliente.id, actual);
    }
    return {
      kpi: {
        total: saldos.reduce((suma, s) => suma + s.saldo, 0),
        por_tipo: [...porTipo]
          .map(([nombre, cantidad]) => ({ nombre, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad),
      },
      top: [...porCliente.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, TOP_CLIENTES)
        .map((c) => ({
          cliente: c.cliente,
          total: c.total,
          detalle: c.detalle.join(' · '),
        })),
    };
  }
}
