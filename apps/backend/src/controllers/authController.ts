import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signToken } from '../auth/jwt';
import { query } from '../db';
import { consumeVerifiedOtp, createAndSendOtp, hasVerifiedOtp, verifyOtp } from '../services/otpService';
import { OtpChannel, UserRole, UserSession } from '../types';

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : undefined))
  .optional();

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email();

const otpTargetSchema = z
  .object({
    channel: z.enum(['email', 'phone', 'telegram']),
    email: optionalText,
    phone: optionalText,
    telegramChatId: optionalText,
    telegramId: optionalText
  })
  .superRefine((value, ctx) => {
    const hasEmail = Boolean(value.email);
    const hasPhone = Boolean(value.phone);
    const hasTelegram = Boolean(value.telegramChatId ?? value.telegramId);

    if (value.channel === 'email' && !hasEmail) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email is required for email OTP.' });
    }

    if (value.channel === 'phone' && !hasPhone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Phone is required for phone OTP.' });
    }

    if (value.channel === 'telegram' && !hasTelegram) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['telegramChatId'],
        message: 'Telegram ID is required for Telegram OTP.'
      });
    }
  })
  .transform((value) => ({
    channel: value.channel,
    email: value.email,
    phone: value.phone,
    telegramChatId: value.telegramChatId ?? value.telegramId
  }));

const registerSchema = z.object({
  email: emailField,
  phone: optionalText,
  telegramChatId: optionalText,
  telegramId: optionalText,
  password: z.string().min(8),
  name: z.string().trim().min(2),
  role: z.enum(['student', 'teacher', 'parent', 'school_admin', 'super_admin']),
  otpChannel: z.enum(['email', 'phone', 'telegram'])
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1).optional(),
  email: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  password: z.string().min(1)
}).superRefine((value, ctx) => {
  if (!value.identifier && !value.email && !value.phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['identifier'], message: 'Email or phone is required.' });
  }
});

const otpRequestSchema = otpTargetSchema;
const otpVerifySchema = otpTargetSchema.and(z.object({ code: z.string().trim().regex(/^\d{6}$/) }));

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

  const { email, phone, password, name, role, otpChannel } = parse.data;
  const telegramChatId = parse.data.telegramChatId ?? parse.data.telegramId;
  const otpTarget = { channel: otpChannel as OtpChannel, email, phone, telegramChatId };
  const verified = await hasVerifiedOtp(otpTarget);
  if (!verified) {
    return res.status(403).json({ message: 'Verify OTP before registration.' });
  }

  const existing = await query<{ id: string }>(
    `SELECT id
     FROM users
     WHERE email = $1
        OR ($2::text IS NOT NULL AND phone = $2)
        OR ($3::text IS NOT NULL AND telegram_chat_id = $3)`,
    [email, phone ?? null, telegramChatId ?? null]
  );
  if (existing.rows.length) {
    return res.status(409).json({ message: 'Email, phone, or Telegram ID already registered.' });
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

  await consumeVerifiedOtp(otpTarget);

  const session: UserSession = { id: result.rows[0].id, email, role, name };
  const token = signToken(session);
  return res.status(201).json({ token, user: session });
}

export async function loginHandler(req: Request, res: Response) {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid login payload.', errors: parse.error.flatten() });
  }

  const { password } = parse.data;
  const identifier = (parse.data.identifier ?? parse.data.email ?? parse.data.phone ?? '').trim();
  const normalizedEmail = identifier.includes('@') ? identifier.toLowerCase() : identifier;
  const normalizedPhone = identifier.replace(/[^\d+]/g, '');

  const result = await query<{ id: string; email: string; password_hash: string; role: UserRole; name: string }>(
    `SELECT id, email, password_hash, role, name
     FROM users
     WHERE email = $1 OR phone = $2
     LIMIT 1`,
    [normalizedEmail, normalizedPhone]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email/phone or password.' });
  }

  const session: UserSession = { id: user.id, email: user.email, role: user.role, name: user.name };
  const token = signToken(session);
  return res.status(200).json({ token, user: session });
}
