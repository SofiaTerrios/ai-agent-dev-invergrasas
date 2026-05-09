import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoInput } from '../graphql/inputs';
import { CertificadoAnalisisModel } from '../graphql/models';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CertificadoTipoDto } from './dto/create-certificado.dto';
import { CertificadoTipo } from '../graphql/enums';

@Resolver()
export class CertificadosResolver {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Mutation(() => CertificadoAnalisisModel)
  @UseGuards(JwtAuthGuard)
  async createCertificado(@Args('input') input: CreateCertificadoInput) {
    const dto = {
      ...input,
      tipo: input.tipo === CertificadoTipo.oleina ? CertificadoTipoDto.oleina : CertificadoTipoDto.rbd,
      parametros: { ...input.parametros },
    };
    return this.certificadosService.createAnalisis(dto);
  }
}
