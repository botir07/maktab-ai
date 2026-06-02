import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: '8h' as const,
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/hana_school_ai',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  otpDevMode: process.env.OTP_DEV_MODE === 'true',
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES ?? 10),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'HANA SCHOOL AI <no-reply@hana-school-ai.local>'
  },
  sms: {
    apiUrl: process.env.SMS_API_URL ?? '',
    apiKey: process.env.SMS_API_KEY ?? '',
    payloadTemplate: process.env.SMS_PAYLOAD_TEMPLATE ?? ''
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? ''
  },
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  groqApiUrl: process.env.GROQ_API_URL ?? 'https://api.groq.dev/v1',
  groqModel: process.env.GROQ_MODEL ?? 'groq2',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  localModelUrl: process.env.LOCAL_MODEL_URL ?? 'http://127.0.0.1:8000'
};
