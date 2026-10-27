import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

const CLAVE_FIRMANTE = 'certificados.firmante_id';

const SIN_FIRMANTE =
  'No hay firmante de certificados configurada. El Super Administrador debe asignarla.';

/**
 * Every certificado de análisis is signed by one person (IG-21): a user,
 * with her name and signature image, chosen by the super admin.
 */
@Injectable()
export class FirmanteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async obtener() {
    const config = await this.prisma.configuracion.findUnique({
      where: { clave: CLAVE_FIRMANTE },
    });
    if (!config) return null;
    // Deactivated users are not found: the certificado cannot be signed
    const user = await this.prisma.user.findUnique({
      where: { id: config.valor },
      select: { id: true, nombre: true, firma_mime: true },
    });
    return user
      ? { id: user.id, nombre: user.nombre, tiene_firma: !!user.firma_mime }
      : null;
  }

  // Name and signature image to sign a new certificado, or a clear error.
  async paraFirmar() {
    const firmante = await this.obtener();
    if (!firmante) throw new BadRequestException(SIN_FIRMANTE);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: firmante.id },
      select: { firma: true },
    });
    if (!user.firma) {
      throw new BadRequestException(
        `${firmante.nombre} no tiene imagen de firma. Súbela en Usuarios.`,
      );
    }
    return {
      id: firmante.id,
      nombre: firmante.nombre,
      firma: Buffer.from(user.firma),
    };
  }

  async asignar(userId: string, actor: { id: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, firma_mime: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.firma_mime) {
      throw new BadRequestException(
        'La firmante debe tener una imagen de firma',
      );
    }
    const anterior = await this.obtener();

    await this.prisma.$transaction(async (tx) => {
      await tx.configuracion.upsert({
        where: { clave: CLAVE_FIRMANTE },
        create: { clave: CLAVE_FIRMANTE, valor: user.id },
        update: { valor: user.id, deleted_at: null },
      });
      await this.auditoria.registrar(
        {
          actorId: actor.id,
          accion: 'certificados.cambiar_firmante',
          entidad: 'configuracion',
          entidadId: CLAVE_FIRMANTE,
          detalle: { de: anterior?.id ?? null, a: user.id },
        },
        tx,
      );
    });
    return { id: user.id, nombre: user.nombre, tiene_firma: true };
  }
}
