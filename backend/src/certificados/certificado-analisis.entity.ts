export type CertificadoTipo = 'oleina' | 'rbd';

export class CertificadoAnalisisEntity {
  id!: string;
  tipo!: CertificadoTipo;
  empresa_cliente!: string;
  nit_cliente?: string | null;
  lote!: string;
  peso_kg?: number | null;
  fecha_emision!: Date;
  fecha_vencimiento!: Date;
  firmado_por!: string;
  archivo_url?: string | null;
  created_at!: Date;
}
