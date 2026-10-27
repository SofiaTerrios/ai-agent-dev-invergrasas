import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesResolver } from './clientes.resolver';
import { CatalogosModule } from '../catalogos/catalogos.module';

@Module({
  imports: [CatalogosModule],
  providers: [ClientesService, ClientesResolver],
  exports: [ClientesService],
})
export class ClientesModule {}
