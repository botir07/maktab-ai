interface ProgressRingProps {
  label: string;
  percent: number;
  accent: string;
}

export function ProgressRing({ label, percent, accent }: ProgressRingProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-inner">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{percent}% mastery</p>
        </div>
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-slate-900" />
          <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-white">{percent}%</div>
          <div className={`absolute inset-0 rounded-full border-8 border-slate-800 border-t-transparent`} style={{ transform: `rotate(${(percent / 100) * 360}deg)` }} />
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-800">
        <div className={`${accent} h-full rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
