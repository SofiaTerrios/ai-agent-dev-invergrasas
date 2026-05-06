import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from '../users/entities/user.entity';
import { hashPassword, comparePasswords } from '../utils/hash';
import { AppDataSource } from '../data-source';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async register(nombre: string, email: string, password: string, rol: Role = 'empleado') {
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) throw new Error('EMAIL_EXISTS');
    const hashed = await hashPassword(password);
    const user = this.repo.create({ nombre, email, password: hashed, rol });
    const saved = await this.repo.save(user);
    return { id: saved.id, nombre: saved.nombre, email: saved.email, rol: saved.rol, created_at: saved.created_at };
  }

  async validateUser(email: string, password: string) {
    const user = await this.repo.findOne({ where: { email } });
    if (!user) return null;
    const match = await comparePasswords(password, user.password);
    if (!match) return null;
    const { password: _p, ...rest } = user as any;
    return rest as Omit<User, 'password'>;
  }

  async login(user: Partial<User>) {
    const payload = { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    return { access_token: token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } };
  }
}
