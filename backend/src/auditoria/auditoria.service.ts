import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type RegistroAuditoria = {
  // Null when the action does not come from a user (e.g. a CLI command)
  actorId: string | null;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: Prisma.InputJsonValue;
};

type Db = Pick<PrismaService, 'auditLog'> | Prisma.TransactionClient;

export function registrarAuditoria(db: Db, registro: RegistroAuditoria) {
  return db.auditLog.create({
    data: {
      actor_id: registro.actorId,
      accion: registro.accion,
      entidad: registro.entidad,
      entidad_id: registro.entidadId,
      detalle: registro.detalle,
    },
  });
}

// Log of sensitive actions (role changes, user activation, anulaciones).
@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  // Pass the transaction client so the entry is saved with the change itself.
  registrar(registro: RegistroAuditoria, db: Db = this.prisma) {
    return registrarAuditoria(db, registro);
  }
}
