import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export enum CertificadoTipoDto {
  oleina = 'oleina',
  rbd = 'rbd',
}

export class CreateCertificadoDto {
  @IsUUID('all', { message: 'empresa_id debe ser un UUID válido' })
  empresa_id!: string;

  @IsOptional()
  @IsUUID('all', { message: 'cliente_id debe ser un UUID válido' })
  cliente_id?: string;

  @IsEnum(CertificadoTipoDto, {
    message: 'tipo debe ser oleina o rbd',
  })
  tipo!: CertificadoTipoDto;

  @IsNotEmpty({ message: 'empresa_cliente es obligatorio' })
  @IsString()
  empresa_cliente!: string;

  @IsOptional()
  @IsString()
  nit_cliente?: string;

  @IsNotEmpty({ message: 'lote es obligatorio' })
  @IsString()
  lote!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber(
    {},
    {
      message:
        'peso_kg debe ser numérico cuando se envía para certificados RBD',
    },
  )
  peso_kg?: number | null;

  @IsNotEmpty({ message: 'fecha_vencimiento es obligatorio' })
  @IsDateString(
    {},
    { message: 'fecha_vencimiento debe tener formato de fecha válido' },
  )
  fecha_vencimiento!: string;

  @IsObject({ message: 'parametros es obligatorio' })
  parametros!: Record<string, string>;

  // Anulado certificado this one corrects (IG-22)
  @IsOptional()
  @IsUUID('all', { message: 'reemplaza_id debe ser un UUID válido' })
  reemplaza_id?: string;
}
