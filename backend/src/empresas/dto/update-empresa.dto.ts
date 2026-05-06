import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  razon_social?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;
}
