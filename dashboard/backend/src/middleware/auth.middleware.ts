import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserSession } from '../types/auth';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = (req.headers as { authorization?: string }).authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const authService = AuthService.getInstance();
    const user = authService.verifyJWT(token);
    
    (req as Request & { user?: UserSession }).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}; 