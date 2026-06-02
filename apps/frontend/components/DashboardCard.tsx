import type { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  accent: string;
  children: ReactNode;
}

export function DashboardCard({ title, value, accent, children }: DashboardCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className={`h-14 w-14 rounded-3xl bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
          {children}
        </div>
      </div>
    </div>
  );
}
