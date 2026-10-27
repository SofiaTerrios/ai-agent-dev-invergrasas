import { Injectable } from '@nestjs/common';
import { TipoMovimiento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TEXTOS_POR_DEFECTO } from './movimiento.types';

const clave = (tipo: TipoMovimiento) => `movimientos.texto.${tipo}`;

// Certifying paragraph of each kind of certificado (IG-28), set by the super
// admin. Each movimiento keeps the text in force when it was issued.
@Injectable()
export class TextosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async texto(tipo: TipoMovimiento) {
    const config = await this.prisma.configuracion.findUnique({
      where: { clave: clave(tipo) },
    });
    return config?.valor ?? TEXTOS_POR_DEFECTO[tipo];
  }

  async todos() {
    return Promise.all(
      Object.values(TipoMovimiento).map(async (tipo) => ({
        tipo,
        texto: await this.texto(tipo),
      })),
    );
  }

  async actualizar(tipo: TipoMovimiento, texto: string, actor: { id: string }) {
    const valor = texto.trim();
    await this.prisma.$transaction(async (tx) => {
      await tx.configuracion.upsert({
        where: { clave: clave(tipo) },
        create: { clave: clave(tipo), valor },
        update: { valor, deleted_at: null },
      });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'movimientos.cambiar_texto',
          entidad: 'configuracion',
          entidadId: clave(tipo),
        },
        tx,
      );
    });
    return { tipo, texto: valor };
  }
}
