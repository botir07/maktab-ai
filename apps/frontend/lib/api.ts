import axios from 'axios';

export type UserRole = 'student' | 'teacher' | 'parent' | 'school_admin' | 'super_admin';
export type OtpChannel = 'email' | 'phone' | 'telegram';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface DashboardResponse {
  attendanceRate: number;
  gradeAverage: number;
  roadmap: Array<{ milestone: string; progress: number }>;
  activeMissions: number;
  todayLessons: Array<{ title: string; description: string; completed: boolean }>;
}

export interface OtpPayload {
  channel: OtpChannel;
  email?: string;
  phone?: string;
  telegramChatId?: string;
}

export interface RegisterPayload extends OtpPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  otpChannel: OtpChannel;
}

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' }
});

export function setAuthToken(token: string | null) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete client.defaults.headers.common.Authorization;
}

export async function checkHealth() {
  const response = await client.get('/health');
  return response.data as { status: string; service: string; timestamp: string };
}

export async function requestOtp(payload: OtpPayload) {
  const response = await client.post('/auth/otp/request', payload);
  return response.data as { message: string; channel: OtpChannel; identifier: string; expiresInMinutes: number; devCode?: string };
}

export async function verifyOtp(payload: OtpPayload & { code: string }) {
  const response = await client.post('/auth/otp/verify', payload);
  return response.data as { message: string; channel: OtpChannel; identifier: string };
}

export async function register(payload: RegisterPayload) {
  const response = await client.post('/auth/register', payload);
  return response.data as AuthResponse;
}

export async function login(payload: { email: string; password: string }) {
  const response = await client.post('/auth/login', payload);
  return response.data as AuthResponse;
}

export async function getProfile() {
  const response = await client.get('/student/profile');
  return response.data as AuthUser & { created_at: string };
}

export async function getDashboard() {
  const response = await client.get('/student/dashboard');
  return response.data as DashboardResponse;
}

export async function fetchAIDialogue(payload: { prompt: string }) {
  const response = await client.post('/ai/tutor', payload);
  return response.data as { content: string; createdAt: string };
}
