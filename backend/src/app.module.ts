import { Module } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmpresasModule } from './empresas/empresas.module';
import { ClientesModule } from './clientes/clientes.module';
import { PrismaModule } from './prisma/prisma.module';
import { CertificadosModule } from './certificados/certificados.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { InventarioModule } from './inventario/inventario.module';
import { InformesModule } from './informes/informes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
    PrismaModule,
    AuditoriaModule,
    AuthModule,
    UsuariosModule,
    CatalogosModule,
    EmpresasModule,
    ClientesModule,
    CertificadosModule,
    VehiculosModule,
    MovimientosModule,
    InventarioModule,
    InformesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
