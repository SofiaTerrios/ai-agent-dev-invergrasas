import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateEmpresaDto {
  @IsNotEmpty()
  @IsString()
  razon_social!: string;

  @IsNotEmpty()
  @IsString()
  nit!: string;

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
