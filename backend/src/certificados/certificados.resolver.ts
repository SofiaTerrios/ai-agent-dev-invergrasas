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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/request.util';
import { CertificadoTipoDto } from './dto/create-certificado.dto';
import { CertificadoTipo } from '../graphql/enums';

@Resolver()
@UseGuards(JwtAuthGuard)
export class CertificadosResolver {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Mutation(() => CertificadoAnalisisModel)
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
  async certificados(
    @CurrentUser() user: AuthUser,
    @Args() { empresaId, ...pagination }: CertificadosArgs,
  ) {
    return this.certificadosService.findAllForUser(user, empresaId, pagination);
  }

  @Query(() => CertificadoModel)
  async certificado(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.certificadosService.findOneForUser(user, id);
  }
}
