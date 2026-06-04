'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { DashboardCard } from '../components/DashboardCard';
import { Navbar } from '../components/Navbar';
import { ProgressRing } from '../components/ProgressRing';
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  LogIn,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Trophy,
  UserPlus,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  AuthUser,
  DashboardResponse,
  OtpChannel,
  UserRole,
  checkHealth,
  getDashboard,
  login,
  register,
  requestOtp,
  setAuthToken,
  verifyOtp
} from '../lib/api';

const tokenKey = 'hana-auth-token';
const userKey = 'hana-auth-user';

const channelOptions: Array<{ value: OtpChannel; label: string; icon: typeof Mail }> = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'telegram', label: 'Telegram', icon: MessageCircle }
];

const roleOptions: UserRole[] = ['student', 'teacher', 'parent', 'school_admin', 'super_admin'];

export default function Home() {
  const [health, setHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    telegramChatId: '',
    password: '',
    role: 'student' as UserRole,
    channel: 'email' as OtpChannel,
    code: ''
  });

  useEffect(() => {
    const storedToken = window.localStorage.getItem(tokenKey);
    const storedUser = window.localStorage.getItem(userKey);
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser) as AuthUser);
    }
  }, []);

  useEffect(() => {
    checkHealth()
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'));
  }, []);

  useEffect(() => {
    if (!token) {
      setDashboard(null);
      return;
    }

    getDashboard()
      .then(setDashboard)
      .catch((err) => setError(getErrorMessage(err)));
  }, [token]);

  const otpPayload = useMemo(
    () => ({
      channel: form.channel,
      email: form.email || undefined,
      phone: form.phone || undefined,
      telegramChatId: form.telegramChatId || undefined
    }),
    [form.channel, form.email, form.phone, form.telegramChatId]
  );

  const summaryItems = [
    { title: 'Attendance', value: `${dashboard?.attendanceRate ?? 0}%`, icon: CalendarCheck, accent: 'from-cyan-500 to-blue-600' },
    { title: 'Grade average', value: `${dashboard?.gradeAverage ?? 0}`, icon: Trophy, accent: 'from-amber-500 to-orange-500' },
    { title: 'Active missions', value: `${dashboard?.activeMissions ?? 0}`, icon: Award, accent: 'from-green-500 to-emerald-600' },
    { title: 'API status', value: health === 'online' ? 'Online' : health === 'offline' ? 'Offline' : 'Checking', icon: Wifi, accent: 'from-violet-500 to-fuchsia-500' }
  ];

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'channel' || key === 'email' || key === 'phone' || key === 'telegramChatId') {
      setOtpVerified(false);
      setDevCode('');
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    await runAction(async () => {
      const response = await login({ email: form.email, password: form.password });
      saveSession(response.token, response.user);
      setStatus('Login successful. Dashboard loaded from backend.');
    });
  };

  const handleRequestOtp = async () => {
    await runAction(async () => {
      const response = await requestOtp(otpPayload);
      setDevCode(response.devCode ?? '');
      setStatus(`OTP sent to ${response.identifier}.`);
    });
  };

  const handleVerifyOtp = async () => {
    await runAction(async () => {
      await verifyOtp({ ...otpPayload, code: form.code });
      setOtpVerified(true);
      setStatus('OTP verified. You can finish registration now.');
    });
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    await runAction(async () => {
      const response = await register({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        telegramChatId: form.telegramChatId || undefined,
        password: form.password,
        role: form.role,
        channel: form.channel,
        otpChannel: form.channel
      });
      saveSession(response.token, response.user);
      setStatus('Registration successful. Dashboard connected.');
    });
  };

  const logout = () => {
    window.localStorage.removeItem(tokenKey);
    window.localStorage.removeItem(userKey);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setDashboard(null);
    setStatus('Logged out.');
  };

  const saveSession = (nextToken: string, nextUser: AuthUser) => {
    window.localStorage.setItem(tokenKey, nextToken);
    window.localStorage.setItem(userKey, JSON.stringify(nextUser));
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const runAction = async (action: () => Promise<void>) => {
    setLoading(true);
    setError('');
    setStatus('');
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[0.95fr_1.35fr]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">Backend link</p>
                <h1 className="mt-3 text-2xl font-semibold text-white">Auth gateway</h1>
              </div>
              <div className={`rounded-2xl p-3 ${health === 'online' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                {health === 'online' ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/80 p-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${authMode === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${authMode === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
              >
                <UserPlus className="h-4 w-4" />
                Register
              </button>
            </div>

            {authMode === 'login' ? (
              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <Field label="Email" type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
                <Field label="Password" type="password" value={form.password} onChange={(value) => updateForm('password', value)} />
                <SubmitButton loading={loading} label="Login with backend" icon={LogIn} />
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                <Field label="Name" value={form.name} onChange={(value) => updateForm('name', value)} />
                <Field label="Email" type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
                <Field label="Phone" value={form.phone} onChange={(value) => updateForm('phone', value)} placeholder="+998901234567" />
                <Field label="Telegram chat id" value={form.telegramChatId} onChange={(value) => updateForm('telegramChatId', value)} />
                <Field label="Password" type="password" value={form.password} onChange={(value) => updateForm('password', value)} />
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Role</span>
                  <select
                    value={form.role}
                    onChange={(event) => updateForm('role', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="text-sm font-medium text-slate-300">OTP channel</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {channelOptions.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => updateForm('channel', item.value)}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm ${form.channel === item.value ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200' : 'border-slate-800 bg-slate-950 text-slate-300'}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Field label="OTP code" value={form.code} onChange={(value) => updateForm('code', value)} placeholder="123456" />
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={handleRequestOtp} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400">
                      Send
                    </button>
                    <button type="button" onClick={handleVerifyOtp} className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                      Verify
                    </button>
                  </div>
                </div>

                {devCode ? <p className="rounded-2xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">Dev OTP: {devCode}</p> : null}
                {otpVerified ? (
                  <p className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    <ShieldCheck className="h-4 w-4" />
                    OTP verified
                  </p>
                ) : null}
                <SubmitButton loading={loading} label="Register and connect" icon={UserPlus} />
              </form>
            )}

            {status ? <p className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{status}</p> : null}
            {error ? <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-soft backdrop-blur-xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">Student dashboard</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {user ? `Welcome, ${user.name ?? user.email}` : 'Login to load backend data'}
                </h2>
                <p className="mt-2 max-w-2xl text-slate-400">
                  {user ? `Connected as ${user.role}. Data below is requested from localhost:4000.` : 'Frontend is ready on localhost:3000 and will call the Express API after login.'}
                </p>
              </div>
              {user ? (
                <button type="button" onClick={logout} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-red-400">
                  Logout
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-950/80 p-4 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-cyan-300" />
                  API URL: localhost:4000
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {summaryItems.map((item) => (
              <DashboardCard key={item.title} title={item.title} value={item.value} accent={item.accent}>
                <item.icon className="h-5 w-5" />
              </DashboardCard>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Learning progress</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Roadmap</h3>
              <div className="mt-8 space-y-6">
                {(dashboard?.roadmap.length ? dashboard.roadmap : [{ milestone: 'No roadmap rows yet', progress: 0 }]).map((item) => (
                  <ProgressRing key={item.milestone} label={item.milestone} percent={Number(item.progress)} accent="bg-cyan-500" />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Today&apos;s lessons</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Backend assignments</h3>
              <div className="mt-6 space-y-4">
                {(dashboard?.todayLessons.length ? dashboard.todayLessons : [{ title: 'No lessons loaded', description: 'Login as a student to fetch dashboard data.', completed: false }]).map((item) => (
                  <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void; // eslint-disable-line no-unused-vars
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
      />
    </label>
  );
}

function SubmitButton({ loading, label, icon: Icon }: { loading: boolean; label: string; icon: typeof LogIn }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
}
