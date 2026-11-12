import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResumenModel } from '../graphql/models';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';

@Resolver()
@UseGuards(JwtAuthGuard)
export class DashboardResolver {
  constructor(private readonly dashboard: DashboardService) {}

  // Any signed-in user; each section follows that user's permissions
  @Query(() => DashboardResumenModel, {
    description:
      'Inicio: KPIs del período frente al anterior (por defecto, el mes en curso), series de 12 meses y listas',
  })
  dashboardResumen(
    @CurrentUser() user: AuthUser,
    @Args('empresaId', { type: () => ID, nullable: true }) empresaId?: string,
    @Args('desde', { nullable: true, description: 'YYYY-MM-DD' })
    desde?: string,
    @Args('hasta', { nullable: true, description: 'YYYY-MM-DD' })
    hasta?: string,
  ) {
    return this.dashboard.resumen(user, empresaId, desde, hasta);
  }
}
