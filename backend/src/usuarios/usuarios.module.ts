import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosResolver } from './usuarios.resolver';

@Module({
  providers: [UsuariosService, UsuariosResolver],
})
export class UsuariosModule {}
