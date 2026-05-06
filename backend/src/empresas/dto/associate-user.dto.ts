import { IsUUID } from 'class-validator';

export class AssociateUserDto {
  @IsUUID()
  userId!: string;
}
