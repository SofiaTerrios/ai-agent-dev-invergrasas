import { IsNotEmpty, IsString } from 'class-validator';

export class ParametrosRbdDto {
  @IsNotEmpty()
  @IsString()
  acidez!: string;

  @IsNotEmpty()
  @IsString()
  humedad!: string;

  @IsNotEmpty()
  @IsString()
  indice_yodo!: string;

  @IsNotEmpty()
  @IsString()
  peroxido!: string;

  @IsNotEmpty()
  @IsString()
  color_amarillo!: string;

  @IsNotEmpty()
  @IsString()
  color_rojo!: string;
}
