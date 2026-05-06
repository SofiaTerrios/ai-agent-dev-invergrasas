import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'inver-secret';

export default function jwtAuthGuard(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = { id: payload.sub, email: payload.email, nombre: payload.nombre, rol: payload.rol };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
