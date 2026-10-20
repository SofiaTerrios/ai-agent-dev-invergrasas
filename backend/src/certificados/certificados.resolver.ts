import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoInput } from '../graphql/inputs';
import {
  CertificadoAnalisisModel,
  CertificadoConnection,
  CertificadoModel,
} from '../graphql/models';
import { CertificadosArgs } from '../graphql/args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PERMISOS } from '../auth/roles';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { CertificadoTipoDto } from './dto/create-certificado.dto';
import { CertificadoTipo } from '../graphql/enums';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificadosResolver {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Mutation(() => CertificadoAnalisisModel)
  @Roles(...PERMISOS.certificados.escribir)
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
  @Roles(...PERMISOS.certificados.leer)
  async certificados(
    @CurrentUser() user: AuthUser,
    @Args() { empresaId, ...pagination }: CertificadosArgs,
  ) {
    return this.certificadosService.findAllForUser(user, empresaId, pagination);
  }

  @Query(() => CertificadoModel)
  @Roles(...PERMISOS.certificados.leer)
  async certificado(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.certificadosService.findOneForUser(user, id);
  }
}
