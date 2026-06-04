import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { config } from '../config';
import { query } from '../db';
import { OtpChannel } from '../types';

interface OtpRecord {
  id: string;
  code_hash: string;
  attempts: number;
  expires_at: Date;
  verified_at: Date | null;
}

export interface OtpTarget {
  channel: OtpChannel;
  email?: string;
  phone?: string;
  telegramChatId?: string;
}

export function getOtpIdentifier(target: OtpTarget) {
  if (target.channel === 'email') {
    return normalizeEmail(target.email);
  }

  if (target.channel === 'phone') {
    return normalizePhone(target.phone);
  }

  return normalizeTelegramChatId(target.telegramChatId);
}

export async function createAndSendOtp(target: OtpTarget) {
  const identifier = getOtpIdentifier(target);
  const code = generateOtpCode();
  const codeHash = hashOtp(code, identifier);

  await query(
    `DELETE FROM otp_verifications
     WHERE channel = $1
       AND identifier = $2
       AND (expires_at <= NOW() OR verified_at IS NULL)`,
    [target.channel, identifier]
  );

  await query(
    `INSERT INTO otp_verifications (channel, identifier, code_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4::int * INTERVAL '1 minute'))`,
    [target.channel, identifier, codeHash, config.otpExpiresMinutes]
  );

  await sendOtp(target.channel, identifier, code);

  return {
    channel: target.channel,
    identifier: maskIdentifier(target.channel, identifier),
    expiresInMinutes: config.otpExpiresMinutes,
    ...(config.otpDevMode ? { devCode: code } : {})
  };
}

export async function verifyOtp(target: OtpTarget, code: string) {
  const identifier = getOtpIdentifier(target);
  const result = await query<OtpRecord>(
    `SELECT id, code_hash, attempts, expires_at, verified_at
     FROM otp_verifications
     WHERE channel = $1 AND identifier = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [target.channel, identifier]
  );

  const record = result.rows[0];
  if (!record) {
    throw new Error('OTP code not found. Request a new code.');
  }

  if (record.verified_at) {
    return { channel: target.channel, identifier: maskIdentifier(target.channel, identifier) };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new Error('OTP code expired. Request a new code.');
  }

  if (record.attempts >= config.otpMaxAttempts) {
    throw new Error('Too many OTP attempts. Request a new code.');
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(record.code_hash),
    Buffer.from(hashOtp(code, identifier))
  );

  await query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1', [record.id]);

  if (!valid) {
    throw new Error('Invalid OTP code.');
  }

  await query('UPDATE otp_verifications SET verified_at = NOW() WHERE id = $1', [record.id]);
  return { channel: target.channel, identifier: maskIdentifier(target.channel, identifier) };
}

export async function hasVerifiedOtp(target: OtpTarget) {
  const identifier = getOtpIdentifier(target);
  const result = await query<{ id: string }>(
    `SELECT id
     FROM otp_verifications
     WHERE channel = $1
       AND identifier = $2
       AND verified_at IS NOT NULL
       AND expires_at > NOW()
     ORDER BY verified_at DESC
     LIMIT 1`,
    [target.channel, identifier]
  );

  return result.rows.length > 0;
}

export async function consumeVerifiedOtp(target: OtpTarget) {
  const identifier = getOtpIdentifier(target);
  await query(
    `DELETE FROM otp_verifications
     WHERE id = (
       SELECT id
       FROM otp_verifications
       WHERE channel = $1
         AND identifier = $2
         AND verified_at IS NOT NULL
         AND expires_at > NOW()
       ORDER BY verified_at DESC
       LIMIT 1
     )`,
    [target.channel, identifier]
  );
}

function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(code: string, identifier: string) {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${identifier}:${code}`)
    .digest('hex');
}

function normalizeEmail(email?: string) {
  const value = email?.trim().toLowerCase();
  if (!value) {
    throw new Error('Email is required for email OTP.');
  }
  return value;
}

function normalizePhone(phone?: string) {
  const value = phone?.trim().replace(/[^\d+]/g, '');
  if (!value || value.length < 8) {
    throw new Error('Valid phone number is required for phone OTP.');
  }
  return value;
}

function normalizeTelegramChatId(telegramChatId?: string) {
  const value = telegramChatId?.trim();
  if (!value) {
    throw new Error('Telegram chat id is required for Telegram OTP.');
  }
  return value;
}

async function sendOtp(channel: OtpChannel, identifier: string, code: string) {
  if (channel === 'email') {
    await sendEmailOtp(identifier, code);
    return;
  }

  if (channel === 'phone') {
    await sendPhoneOtp(identifier, code);
    return;
  }

  await sendTelegramOtp(identifier, code);
}

async function sendEmailOtp(email: string, code: string) {
  if (!config.smtp.host) {
    handleMissingProvider('SMTP');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
  });

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'HANA SCHOOL AI verification code',
    text: `Your HANA SCHOOL AI verification code is ${code}. It expires in ${config.otpExpiresMinutes} minutes.`
  });
}

async function sendPhoneOtp(phone: string, code: string) {
  if (!config.sms.apiUrl) {
    handleMissingProvider('SMS');
    return;
  }

  const message = `Your HANA SCHOOL AI verification code is ${code}. It expires in ${config.otpExpiresMinutes} minutes.`;
  const body = config.sms.payloadTemplate
    ? applySmsTemplate(config.sms.payloadTemplate, phone, message, code)
    : JSON.stringify({ to: phone, message });

  const response = await fetch(config.sms.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.sms.apiKey ? { Authorization: `Bearer ${config.sms.apiKey}` } : {})
    },
    body
  });

  if (!response.ok) {
    throw new Error('SMS provider rejected the OTP request.');
  }
}

async function sendTelegramOtp(chatId: string, code: string) {
  if (!config.telegram.botToken) {
    handleMissingProvider('Telegram');
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `Your HANA SCHOOL AI verification code is ${code}. It expires in ${config.otpExpiresMinutes} minutes.`
    })
  });

  if (!response.ok) {
    throw new Error('Telegram rejected the OTP request. Check bot token and chat id.');
  }
}

function applySmsTemplate(template: string, phone: string, message: string, code: string) {
  return template
    .replaceAll('{{phone}}', phone)
    .replaceAll('{{message}}', message)
    .replaceAll('{{code}}', code);
}

function handleMissingProvider(provider: string) {
  if (config.otpDevMode) {
    return;
  }

  throw new Error(`${provider} provider is not configured.`);
}

function maskIdentifier(channel: OtpChannel, identifier: string) {
  if (channel === 'email') {
    const [name, domain] = identifier.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }

  if (channel === 'phone') {
    return `${identifier.slice(0, 4)}***${identifier.slice(-2)}`;
  }

  return `${identifier.slice(0, 3)}***`;
}
