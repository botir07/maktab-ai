import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken } from '../auth/jwt';
import { query } from '../db';
import { createAndSendOtp, hasVerifiedOtp, verifyOtp } from '../services/otpService';
import { OtpChannel, UserRole, UserSession } from '../types';

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8).optional(),
  telegramChatId: z.string().min(1).optional(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['student', 'teacher', 'parent', 'school_admin', 'super_admin']),
  otpChannel: z.enum(['email', 'phone', 'telegram'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const otpRequestSchema = z.object({
  channel: z.enum(['email', 'phone', 'telegram']),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  telegramChatId: z.string().min(1).optional()
});

const otpVerifySchema = otpRequestSchema.extend({
  code: z.string().regex(/^\d{6}$/)
});

export async function requestOtpHandler(req: Request, res: Response) {
  const parse = otpRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid OTP request.', errors: parse.error.flatten() });
  }

  try {
    const result = await createAndSendOtp(parse.data);
    return res.status(201).json({ message: 'OTP code sent.', ...result });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to send OTP code.' });
  }
}

export async function verifyOtpHandler(req: Request, res: Response) {
  const parse = otpVerifySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid OTP verification payload.', errors: parse.error.flatten() });
  }

  const { code, ...target } = parse.data;

  try {
    const result = await verifyOtp(target, code);
    return res.status(200).json({ message: 'OTP verified.', ...result });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to verify OTP code.' });
  }
}

export async function registerHandler(req: Request, res: Response) {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid registration payload.', errors: parse.error.flatten() });
  }

  const { email, phone, telegramChatId, password, name, role, otpChannel } = parse.data;
  const otpTarget = { channel: otpChannel as OtpChannel, email, phone, telegramChatId };
  const verified = await hasVerifiedOtp(otpTarget);
  if (!verified) {
    return res.status(403).json({ message: 'Verify OTP before registration.' });
  }

  const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone ?? null]);
  if (existing.rows.length) {
    return res.status(409).json({ message: 'Email or phone already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query<{ id: string }>(
    `INSERT INTO users (
       email,
       phone,
       telegram_chat_id,
       password_hash,
       name,
       role,
       email_verified,
       phone_verified,
       telegram_verified
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      email,
      phone ?? null,
      telegramChatId ?? null,
      passwordHash,
      name,
      role,
      otpChannel === 'email',
      otpChannel === 'phone',
      otpChannel === 'telegram'
    ]
  );

  const session: UserSession = { id: result.rows[0].id, email, role };
  const token = signToken(session);
  return res.status(201).json({ token, user: session });
}

export async function loginHandler(req: Request, res: Response) {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid login payload.', errors: parse.error.flatten() });
  }

  const { email, password } = parse.data;
  const result = await query<{ id: string; password_hash: string; role: UserRole; name: string }>(
    'SELECT id, password_hash, role, name FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const session: UserSession = { id: user.id, email, role: user.role, name: user.name };
  const token = signToken(session);
  return res.status(200).json({ token, user: session });
}
