import { DashboardCard } from '../components/DashboardCard';
import { Navbar } from '../components/Navbar';
import { ProgressRing } from '../components/ProgressRing';
import { ArrowUpRight, Award, CalendarCheck, Sparkles, Trophy, Zap } from 'lucide-react';

const summaryItems = [
  { title: 'XP Earned', value: '4,980', icon: Zap, accent: 'from-cyan-500 to-blue-600' },
  { title: 'Current Level', value: '14', icon: Trophy, accent: 'from-amber-500 to-orange-500' },
  { title: 'Weekly Streak', value: '19 days', icon: CalendarCheck, accent: 'from-green-500 to-emerald-600' },
  { title: 'Active Goals', value: '5', icon: Award, accent: 'from-violet-500 to-fuchsia-500' }
];

const insights = [
  {
    title: 'Learning gap detected in Geometry',
    description: 'AI recommends targeted practice focusing on shapes, proofs, and analytical reasoning.',
    icon: ArrowUpRight
  },
  {
    title: 'Career fit: AI Engineering',
    description: 'Your performance and interests align with advanced computing and research pathways.',
    icon: Sparkles
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-soft backdrop-blur-xl">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">Student dashboard</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Welcome back, Amina</h1>
                  <p className="mt-2 max-w-2xl text-slate-400">Your AI tutor prepared a personalized roadmap for tomorrow and matched you with 3 new learning missions.</p>
                </div>
                <div className="flex items-center gap-4 rounded-3xl bg-slate-950/80 p-4 text-slate-300 shadow-inner">
                  <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm uppercase text-slate-400">Next milestone</p>
                    <p className="text-xl font-semibold">Knowledge Mastery Level 15</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {summaryItems.map((item) => (
                <DashboardCard key={item.title} title={item.title} value={item.value} accent={item.accent}>
                  <item.icon className="h-5 w-5" />
                </DashboardCard>
              ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Learning Progress</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Weekly mastery</h2>
                  </div>
                </div>
                <div className="mt-8 space-y-6">
                  <ProgressRing label="Algebra" percent={88} accent="bg-cyan-500" />
                  <ProgressRing label="Geometry" percent={43} accent="bg-emerald-500" />
                  <ProgressRing label="Physics" percent={72} accent="bg-violet-500" />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">AI recommendations</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">Personalized actions</h2>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {insights.map((item) => (
                    <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-2xl bg-slate-800 p-3 text-cyan-300">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Today&apos;s lessons</p>
              <div className="mt-6 space-y-4">
                {['Math: Geometry practice', 'AI tutor review session', 'English reading comprehension'].map((item) => (
                  <div key={item} className="rounded-3xl bg-slate-950/80 p-4 text-slate-200 shadow-inner">
                    <p className="font-semibold">{item}</p>
                    <p className="mt-1 text-sm text-slate-400">Complete in 45 minutes with AI guided checkpoints.</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Seasonal challenge</p>
              <h3 className="mt-4 text-xl font-semibold text-white">AI Engineering Sprint</h3>
              <p className="mt-3 text-slate-400">Complete 3 adaptive exams and unlock a new project badge.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Career snapshot</p>
              <div className="mt-5 grid gap-3 rounded-3xl bg-slate-950/80 p-4">
                <div className="flex items-center justify-between text-slate-200">
                  <span>AI Engineering</span>
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950">Strong fit</span>
                </div>
                <p className="text-sm text-slate-400">Focus on advanced algorithms, data science, and exam preparation.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
