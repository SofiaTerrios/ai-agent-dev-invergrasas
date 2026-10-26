import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoInput } from '../graphql/inputs';
import {
  CertificadoAnalisisModel,
  CertificadoConnection,
  CertificadoModel,
  FirmanteModel,
} from '../graphql/models';
import { CertificadosArgs } from '../graphql/args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permiso } from '../auth/decorators/permiso.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { CertificadoTipoDto } from './dto/create-certificado.dto';
import { CertificadoTipo } from '../graphql/enums';
import { FirmanteService } from './firmante.service';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificadosResolver {
  constructor(
    private readonly certificadosService: CertificadosService,
    private readonly firmanteService: FirmanteService,
  ) {}

  @Mutation(() => CertificadoAnalisisModel)
  @Permiso('certificados', 'escribir')
  async createCertificado(
    @Args('input') input: CreateCertificadoInput,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = {
      ...input,
      tipo:
        input.tipo === CertificadoTipo.oleina
          ? CertificadoTipoDto.oleina
          : CertificadoTipoDto.rbd,
      parametros: { ...input.parametros },
    };
    return this.certificadosService.createAnalisis(dto, user);
  }

  @Query(() => CertificadoConnection)
  @Permiso('certificados', 'leer')
  async certificados(
    @CurrentUser() user: AuthUser,
    @Args() { first, after, ...filtros }: CertificadosArgs,
  ) {
    return this.certificadosService.findAllForUser(user, filtros, {
      first,
      after,
    });
  }

  @Query(() => CertificadoModel)
  @Permiso('certificados', 'leer')
  async certificado(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.certificadosService.findOneForUser(user, id);
  }

  @Mutation(() => CertificadoModel)
  @Permiso('certificados', 'anular')
  async anularCertificado(
    @Args('id', { type: () => ID }) id: string,
    @Args('motivo') motivo: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.certificadosService.anular(user, id, motivo);
  }

  @Query(() => FirmanteModel, {
    nullable: true,
    description: 'Quién firma los certificados de análisis',
  })
  @Permiso('certificados', 'leer')
  async firmanteCertificados() {
    return this.firmanteService.obtener();
  }

  @Mutation(() => FirmanteModel)
  @Permiso('certificados', 'configurarFirmante')
  async asignarFirmanteCertificados(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.firmanteService.asignar(userId, user);
  }
}
