import express, { Router, Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppDataSource } from '../data-source';
import { Cliente } from './entities/cliente.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { jwtAuthMiddleware as jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const router: Router = express.Router();
const clienteRepo = AppDataSource.getRepository(Cliente);
const empresaRepo = AppDataSource.getRepository(Empresa);

router.post('/', jwtAuthGuard, async (req: Request, res: Response) => {
  const dto = plainToInstance(CreateClienteDto, req.body);
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
    // Verify that the empresa exists
    const empresa = await empresaRepo.findOne({
      where: { id: dto.empresa_id },
    });
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa not found' });
    }

    const cliente = clienteRepo.create(dto as any);
    const saved = await clienteRepo.save(cliente);
    return res.status(201).json(saved);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.put('/:id', jwtAuthGuard, async (req: Request, res: Response) => {
  const dto = plainToInstance(UpdateClienteDto, req.body);
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
    const existing = await clienteRepo.findOne({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Cliente not found' });
    }

    // If empresa_id is being updated, verify it exists
    if (dto.empresa_id && dto.empresa_id !== existing.empresa_id) {
      const empresa = await empresaRepo.findOne({
        where: { id: dto.empresa_id },
      });
      if (!empresa) {
        return res.status(404).json({ message: 'Empresa not found' });
      }
    }

    const merged = clienteRepo.merge(existing, dto);
    const saved = await clienteRepo.save(merged);
    return res.status(200).json(saved);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.delete('/:id', jwtAuthGuard, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await clienteRepo.findOne({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Cliente not found' });
    }

    await clienteRepo.delete({ id });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

export default router;
