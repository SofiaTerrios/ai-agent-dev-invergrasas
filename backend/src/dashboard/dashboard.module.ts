import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [InventarioModule],
  providers: [DashboardService, DashboardResolver],
})
export class DashboardModule {}
