export type UserRole = 'student' | 'teacher' | 'parent' | 'school_admin' | 'super_admin';
export type OtpChannel = 'email' | 'phone' | 'telegram';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface JwtPayload extends UserSession {}
