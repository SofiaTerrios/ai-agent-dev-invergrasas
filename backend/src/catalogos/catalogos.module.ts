import { Module } from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { CatalogosResolver } from './catalogos.resolver';

@Module({
  providers: [CatalogosService, CatalogosResolver],
  exports: [CatalogosService],
})
export class CatalogosModule {}
