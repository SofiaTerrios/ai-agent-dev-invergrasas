// Mirrors the Prisma `Rol` enum
export enum Role {
  super_admin = 'super_admin',
  admin = 'admin',
  comercial = 'comercial',
  calidad = 'calidad',
  entrega = 'entrega',
  empleado = 'empleado',
}

export enum Producto {
  RBD = 'RBD',
  Oleina = 'Oleina',
}

export enum TipoEmpaque {
  Granel = 'Granel',
  Caneca = 'Caneca',
  Balde = 'Balde',
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
