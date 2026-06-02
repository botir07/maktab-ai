import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/jwt';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  auth?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  try {
    const token = authorization.replace('Bearer ', '');
    const payload = verifyToken(token);
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function authorize(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.auth;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
    next();
  };
}
