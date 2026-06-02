'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const themeKey = 'hana-theme';

export function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem(themeKey) as 'dark' | 'light' | null;
    const preferred = stored ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(preferred);
    document.documentElement.dataset.theme = preferred;
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(themeKey, next);
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/20">
            HS
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">HANA SCHOOL AI</p>
            <p className="text-sm text-slate-400">Unified adaptive learning platform</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-700 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </header>
  );
}
