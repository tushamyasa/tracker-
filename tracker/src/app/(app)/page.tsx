import { Flame, Play, Ruler, Trophy } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ProgressRing } from "@/components/gamification/ProgressRing";
import { Heatmap } from "@/components/progress/Heatmap";
import { ThemeLangSwitch } from "@/components/ThemeLangSwitch";
import { Card } from "@/components/ui/Card";
import { bodyUnit, latestWithDelta } from "@/lib/body";
import { db } from "@/lib/db";
import { loadGamification } from "@/lib/gamification-data";
import { buildHeatmap } from "@/lib/progress";
import { kgToDisplay, unitLabel, type Units } from "@/lib/units";
import { startWorkout } from "@/server/actions/workouts";
import { requireUser } from "@/server/auth/session";

export default async function Home() {
  const user = await requireUser();
  const t = await getTranslations();
  const locale = await getLocale();
  const format = await getFormatter();
  const units = user.units as Units;
  const g = await loadGamification(user.id, user.weeklyGoal);

  // День недели считаем по UTC, как и остальную статистику: 0 = понедельник.
  const weekday = (new Date().getUTCDay() + 6) % 7;
  const [todays, active, last, starts, measurements] = await Promise.all([
    db.template.findMany({
      where: { userId: user.id, weekday },
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    db.workout.findFirst({ where: { userId: user.id, status: "active" }, select: { id: true } }),
    db.workout.findFirst({
      where: { userId: user.id, status: "finished" },
      orderBy: { startedAt: "desc" },
    }),
    db.workout.findMany({
      where: {
        userId: user.id,
        status: "finished",
        startedAt: { gte: new Date(Date.now() - 366 * 86_400_000) },
      },
      select: { startedAt: true },
    }),
    db.bodyMeasurement.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
  ]);
  const heatWeeks = buildHeatmap(starts.map((s) => s.startedAt)).slice(-17);
  const weight = latestWithDelta(measurements, "weight", units);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {user.name ? t("home.greeting", { name: user.name }) : t("app.name")}
        </h1>
        <p className="mt-1 text-muted">{t("app.tagline")}</p>
      </div>

      <Link
        href="/workout/active"
        className="flex min-h-14 items-center justify-center gap-2 rounded-control bg-accent px-6 text-lg font-semibold text-white"
      >
        <Play className="size-5" aria-hidden />
        {t("home.start")}
      </Link>

      {active && (
        <Link
          href="/workout/active"
          className="flex items-center gap-3 rounded-card bg-accent-soft p-4 font-semibold text-accent-text"
          data-testid="active-banner"
        >
          <Play className="size-5" aria-hidden />
          {t("history.activeBanner")}
        </Link>
      )}

      <section
        aria-label={t("home.todayTitle")}
        className="flex flex-col gap-3"
        data-testid="today-plan"
      >
        <h2 className="text-lg font-bold">{t("home.todayTitle")}</h2>
        {todays.length === 0 ? (
          <p className="text-sm text-muted" data-testid="today-empty">
            {t("home.todayEmpty")}{" "}
            <Link href="/templates" className="text-accent-text underline">
              {t("home.goTemplates")}
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todays.map((tpl) => (
              <li key={tpl.id}>
                <Card className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-heading font-bold">{tpl.name}</div>
                    <div className="text-xs text-muted">
                      {t("templates.exerciseCount", { count: tpl._count.items })}
                    </div>
                  </div>
                  <form action={startWorkout.bind(null, tpl.id)}>
                    <button
                      type="submit"
                      aria-label={`${t("templates.start")}: ${tpl.name}`}
                      className="min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-white"
                    >
                      {t("templates.start")}
                    </button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex items-center gap-4" data-testid="week-card">
          <ProgressRing ratio={g.week.ratio} label={t("gamification.weeklyGoal")}>
            <span className="font-heading text-xl font-extrabold" data-testid="week-count">
              {g.week.count}/{g.week.goal}
            </span>
          </ProgressRing>
          <div>
            <div className="font-heading font-bold">{t("gamification.weeklyGoal")}</div>
            <div className="text-sm text-muted">
              {g.week.done
                ? t("gamification.goalDone")
                : t("gamification.goalLeft", { count: g.week.goal - g.week.count })}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center gap-3">
          <div className="flex items-center gap-3">
            <Flame
              className={g.streak.current > 0 ? "size-8 text-warning" : "size-8 text-muted"}
              aria-hidden
            />
            <div>
              <div className="font-heading text-xl font-extrabold" data-testid="streak">
                {t("gamification.streakDays", { count: g.streak.current })}
              </div>
              <div className="text-xs text-muted">
                {t("gamification.longestStreak", { count: g.streak.longest })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={last ? `/workouts/${last.id}` : "/workouts"}>
          <Card
            className="flex h-full flex-col gap-1 hover:bg-surface-2"
            data-testid="last-workout"
          >
            <span className="text-xs text-muted">{t("home.lastWorkout")}</span>
            {last ? (
              <>
                <span className="truncate font-heading text-lg font-bold">{last.name}</span>
                <span className="text-sm text-muted">
                  {format.dateTime(last.startedAt, { dateStyle: "medium" })} ·{" "}
                  {Math.round(kgToDisplay(last.totalVolume, units)).toLocaleString(locale)}{" "}
                  {unitLabel(units)}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted">{t("home.noWorkouts")}</span>
            )}
          </Card>
        </Link>
        <Link href="/body">
          <Card className="flex h-full flex-col gap-1 hover:bg-surface-2" data-testid="body-card">
            <span className="flex items-center gap-2 text-xs text-muted">
              <Ruler className="size-4" aria-hidden />
              {t("body.title")}
            </span>
            {weight ? (
              <>
                <span className="font-heading text-lg font-bold" data-testid="home-weight">
                  {weight.value} {bodyUnit("weight", units)}
                </span>
                {weight.delta !== null && (
                  <span className="text-sm text-muted">
                    {weight.delta > 0 ? "+" : ""}
                    {weight.delta} {bodyUnit("weight", units)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-muted">{t("home.noMeasurements")}</span>
            )}
          </Card>
        </Link>
      </div>

      <Card className="flex flex-col gap-3" data-testid="home-heatmap">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">{t("home.activity")}</h2>
          <Link href="/progress" className="text-sm text-accent-text underline">
            {t("nav.progress")}
          </Link>
        </div>
        <Heatmap
          weeks={heatWeeks}
          label={t("home.activity")}
          cellLabel={(key, count) => `${key}: ${count}`}
        />
      </Card>

      <Link href="/achievements">
        <Card className="flex flex-col gap-2 hover:bg-surface-2" data-testid="level-card">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-heading text-lg font-bold">
              <Trophy className="size-5 text-gold" aria-hidden />
              {t("gamification.level", { level: g.level.level })}
            </span>
            <span className="text-sm text-muted" data-testid="xp-total">
              {g.level.xp} / {g.level.nextAt} XP
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round(g.level.progress * 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted">{t("gamification.openAchievements")}</span>
        </Card>
      </Link>

      <div className="lg:hidden">
        <ThemeLangSwitch />
      </div>
    </div>
  );
}
