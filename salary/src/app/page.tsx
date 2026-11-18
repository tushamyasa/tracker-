import Link from "next/link";
import { ArrowUpRight, TrendingUp, Wallet, ShieldCheck, PieChart, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen relative flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 selection:bg-emerald-500/20">
      {/* Background ambient glow */}
      <div className="absolute top-[-10rem] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[20rem] -left-20 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="w-full border-b border-white/10 backdrop-blur-md bg-slate-950/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">Salary</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-md font-medium text-slate-300 hover:text-white transition-colors"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="text-sm px-4 py-2 rounded-md font-medium bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm flex items-center gap-1.5"
            >
              Начать бесплатно
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next.js 15 + Turso libSQL</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Полный контроль над вашими <span className="text-emerald-400">доходами</span> и{" "}
          <span className="text-rose-400">расходами</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Быстрый учёт финансов с моментальным вводом, категориями, интерактивной аналитикой и
          стеклянным дизайном.
        </p>

        {/* Hero preview card */}
        <div className="mt-12 glass-panel p-6 rounded-md max-w-xl mx-auto text-left relative overflow-hidden border border-white/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Общий баланс</p>
              <p className="text-3xl font-bold text-white font-mono mt-1">145 200 ₽</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% к прошлому месяцу</span>
              </div>
            </div>
            <div className="h-8 px-2.5 rounded-md bg-white/5 border border-white/10 text-xs flex items-center text-slate-300">
              Ноябрь 2026
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-400 font-medium">Доходы</span>
              <p className="text-lg font-bold text-emerald-300 font-mono mt-0.5">+ 210 000 ₽</p>
            </div>
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20">
              <span className="text-xs text-rose-400 font-medium">Расходы</span>
              <p className="text-lg font-bold text-rose-300 font-mono mt-0.5">- 64 800 ₽</p>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
          <div className="p-4 rounded-md glass-panel border border-white/10">
            <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-emerald-400 mb-3">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">Категории и бюджеты</h3>
            <p className="text-xs text-slate-400 mt-1">
              Удобная группировка доходов и трат с кастомными иконками и цветами.
            </p>
          </div>

          <div className="p-4 rounded-md glass-panel border border-white/10">
            <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-indigo-400 mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">Приватность и Turso</h3>
            <p className="text-xs text-slate-400 mt-1">
              Изолированные данные каждого пользователя и скрытие баланса в один клик.
            </p>
          </div>

          <div className="p-4 rounded-md glass-panel border border-white/10">
            <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-emerald-400 mb-3">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">Быстрый ввод 3 сек</h3>
            <p className="text-xs text-slate-400 mt-1">
              Оптимизировано для мгновенного добавления расходов со смартфона и ПК.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        Salary Tracker © 2026. Разработано на Next.js & Turso DB.
      </footer>
    </main>
  );
}
