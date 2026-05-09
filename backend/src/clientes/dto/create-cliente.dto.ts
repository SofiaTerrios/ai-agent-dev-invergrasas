import { IsNotEmpty, IsString, IsEmail, IsUUID } from 'class-validator';

export class CreateClienteDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsNotEmpty()
  @IsString()
  contacto!: string;

  @IsNotEmpty()
  @IsString()
  telefono!: string;

  @IsNotEmpty()
  @IsEmail()
  correo!: string;

  @IsNotEmpty()
  @IsUUID()
  empresa_id!: string;
}
