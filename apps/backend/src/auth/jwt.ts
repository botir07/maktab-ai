import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, UserSession } from '../types';

export function signToken(user: UserSession) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
