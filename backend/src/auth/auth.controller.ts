import express, { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import jwtAuthGuard from './guards/jwt-auth.guard';

const router = Router();
const service = new AuthService(AppDataSource.getRepository(User));

router.post('/register', async (req: Request, res: Response) => {
  const dto = plainToInstance(RegisterUserDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    const formatted = errors.map((e) => ({ property: e.property, constraints: e.constraints }));
    return res.status(400).json({ message: 'validation error', errors: formatted });
  }
  try {
    const result = await service.register(dto.nombre, dto.email, dto.password, dto.rol as any);
    return res.status(201).json(result);
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') return res.status(409).json({ message: 'Email already registered' });
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const dto = plainToInstance(LoginUserDto, req.body);
  const errors = await validate(dto);
  if (errors.length > 0) {
    const formatted = errors.map((e) => ({ property: e.property, constraints: e.constraints }));
    return res.status(400).json({ message: 'validation error', errors: formatted });
  }

  try {
    const valid = await service.validateUser(dto.email, dto.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    const result = await service.login(valid as any);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

router.get('/profile', jwtAuthGuard, (req: Request, res: Response) => {
  return res.status(200).json({ user: (req as any).user });
});

export default router;
