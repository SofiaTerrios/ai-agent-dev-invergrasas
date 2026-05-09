import express, { Router, Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppDataSource } from '../data-source';
import { Empresa } from './entities/empresa.entity';
import { UserEmpresa } from './entities/user-empresa.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { jwtAuthMiddleware as jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const router: Router = express.Router();
const repo = AppDataSource.getRepository(Empresa);
const userEmpresaRepo = AppDataSource.getRepository(UserEmpresa);
const clienteRepo = AppDataSource.getRepository(Cliente);

router.post('/', jwtAuthGuard, async (req: Request, res: Response) => {
  const dto = plainToInstance(CreateEmpresaDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    const formatted = errors.map((e) => ({
      property: e.property,
      constraints: e.constraints,
    }));
    return res
      .status(400)
      .json({ message: 'validation error', errors: formatted });
  }

  try {
    const exists = await repo.findOne({ where: { nit: dto.nit } });
    if (exists) return res.status(409).json({ message: 'NIT already exists' });
    const ent = repo.create(dto as any);
    const saved = await repo.save(ent);
    return res.status(201).json(saved);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.put('/:id', jwtAuthGuard, async (req: Request, res: Response) => {
  const dto = plainToInstance(UpdateEmpresaDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    const formatted = errors.map((e) => ({
      property: e.property,
      constraints: e.constraints,
    }));
    return res
      .status(400)
      .json({ message: 'validation error', errors: formatted });
  }

  try {
    const id = req.params.id as string;
    const existing = await repo.findOne({ where: { id: id } });
    if (!existing)
      return res.status(404).json({ message: 'Empresa not found' });
    if (dto.nit && dto.nit !== existing.nit) {
      const conflict = await repo.findOne({ where: { nit: dto.nit } });
      if (conflict)
        return res.status(409).json({ message: 'NIT already exists' });
    }
    const merged = repo.merge(existing, dto);
    const saved = await repo.save(merged);
    return res.status(200).json(saved);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/', jwtAuthGuard, async (req: Request, res: Response) => {
  const uid = (req as any).user?.id;
  if (!uid) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const empresas = await AppDataSource.manager
      .createQueryBuilder(Empresa, 'e')
      .innerJoin(UserEmpresa, 'ue', 'ue.empresa_id = e.id')
      .where('ue.user_id = :uid', { uid })
      .getMany();
    return res.status(200).json(empresas);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get(
  '/:empresaId/clientes',
  jwtAuthGuard,
  async (req: Request, res: Response) => {
    const empresaId = req.params.empresaId as string;

    try {
      const empresa = await repo.findOne({ where: { id: empresaId } });
      if (!empresa) {
        return res.status(404).json({ message: 'Empresa not found' });
      }

      const clientes = await clienteRepo.find({
        where: { empresa_id: empresaId },
      });
      return res.status(200).json(clientes);
    } catch (err) {
      return res.status(500).json({ message: 'Internal error' });
    }
  },
);

export default router;
