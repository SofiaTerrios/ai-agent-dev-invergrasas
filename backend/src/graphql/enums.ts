// Mirrors the Prisma `Rol` enum
export enum Role {
  super_admin = 'super_admin',
  admin = 'admin',
  comercial = 'comercial',
  calidad = 'calidad',
  entrega = 'entrega',
  empleado = 'empleado',
}

export enum CertificadoTipo {
  oleina = 'oleina',
  rbd = 'rbd',
}

// Mirrors the Prisma `TipoEmpresa` enum: roles of a cliente (IG-36)
export enum TipoEmpresa {
  GENERADOR = 'GENERADOR',
  TRANSPORTADOR = 'TRANSPORTADOR',
  DESTINO = 'DESTINO',
  GESTOR = 'GESTOR',
}

// Mirrors the Prisma `TipoMovimiento` enum (IG-39)
export enum TipoMovimiento {
  ENTREGA = 'ENTREGA',
  RECOLECCION = 'RECOLECCION',
  ENTREGA_Y_RECOLECCION = 'ENTREGA_Y_RECOLECCION',
}
