import { ArrowLeft, PartyPopper, Pencil, Repeat, Trophy } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AchievementIcon } from "@/components/gamification/AchievementIcon";
import { Celebrate } from "@/components/gamification/Celebrate";
import { Card } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { exerciseName } from "@/lib/exercises";
import { levelInfo } from "@/lib/gamification";
import { loadGamification } from "@/lib/gamification-data";
import { groupByExercise, loadHistorySamples } from "@/lib/progress-data";
import { formatRecordValue } from "@/lib/record-format";
import { metricsOf, scanHistory } from "@/lib/records";
import { formatDuration, kgToDisplay, unitLabel, type Units } from "@/lib/units";
import { fieldsForKind } from "@/lib/workout-types";
import { deleteWorkout, repeatWorkout } from "@/server/actions/history";
import { requireUser } from "@/server/auth/session";
import { DeleteWorkoutButton } from "./DeleteWorkoutButton";

export default async function WorkoutSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { done } = await searchParams;
  const t = await getTranslations("workout");
  const ex = await getTranslations("exercises");
  const h = await getTranslations("history");
  const locale = await getLocale();
  const format = await getFormatter();
  const units = user.units as Units;

  const w = await db.workout.findFirst({
    where: { id, userId: user.id },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true, sets: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!w) notFound();
  if (w.status === "active") redirect("/workout/active");

  const durationSec = w.finishedAt ? (w.finishedAt.getTime() - w.startedAt.getTime()) / 1000 : 0;
  const pr = await getTranslations("progress");
  // Рекорды этой тренировки: сравниваем с историей, как она выглядела на тот момент.
  const grouped = groupByExercise(
    await loadHistorySamples(user.id, { exerciseIds: w.exercises.map((e) => e.exerciseId) }),
  );
  const records = w.exercises.flatMap((we) => {
    const list = grouped.get(we.exerciseId) ?? [];
    if (list.length === 0) return [];
    const kind = list[0].kind;
    return scanHistory(
      list.map((h) => h.sample),
      kind,
    )
      .events.filter((ev) => ev.set.workoutId === w.id)
      .flatMap((ev) =>
        ev.types.map((type) => ({
          setId: ev.set.id,
          type,
          name: exerciseName(we.exercise, locale),
          value: formatRecordValue(type, metricsOf(ev.set, kind)[type] ?? 0, units),
        })),
      );
  });
  const setCount = w.exercises.reduce((n, e) => n + e.sets.length, 0);

  // Игровые итоги: XP тренировки, новый уровень, серия и открытые на ней достижения.
  const g = await loadGamification(user.id, user.weeklyGoal);
  const gt = await getTranslations("gamification");
  const xpGained = g.workoutXp(w.id);
  const leveledUp = levelInfo(g.xp - xpGained).level < g.level.level;
  const unlocked = await db.userAchievement.findMany({
    where: { userId: user.id, workoutId: w.id },
    orderBy: { unlockedAt: "asc" },
  });
  const celebrate = !!done && (records.length > 0 || unlocked.length > 0 || leveledUp);

  const stat = (label: string, value: string, testId: string) => (
    <Card className="p-4">
      <div className="text-xs text-muted">{label}</div>
      <div data-testid={testId} className="font-heading text-xl font-extrabold">
        {value}
      </div>
    </Card>
  );

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/workouts" className="inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToWorkouts")}
      </Link>

      {done && (
        <div className="flex items-center gap-3 rounded-card bg-accent-soft p-4 text-accent-text">
          <PartyPopper className="size-6" aria-hidden />
          <span className="font-semibold">{t("greatJob")}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{w.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {format.dateTime(w.startedAt, { dateStyle: "long", timeStyle: "short" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat(t("duration"), formatDuration(durationSec), "stat-duration")}
        {stat(
          t("volume"),
          `${Math.round(kgToDisplay(w.totalVolume, units)).toLocaleString(locale)} ${unitLabel(units)}`,
          "stat-volume",
        )}
        {stat(t("sets"), String(setCount), "stat-sets")}
        {stat(t("exercisesCount"), String(w.exercises.length), "stat-exercises")}
      </div>

      {done && <Celebrate enabled={celebrate && user.effectsEnabled} />}

      <Card className="flex flex-col gap-2 p-4" data-testid="xp-card">
        <div className="flex items-center justify-between gap-3">
          <span className="font-heading text-lg font-bold" data-testid="xp-gained">
            {gt("xpGained", { xp: xpGained })}
          </span>
          <span className="text-sm text-muted">
            {gt("level", { level: g.level.level })} ·{" "}
            {gt("streakDays", { count: g.streak.current })}
          </span>
        </div>
        {leveledUp && (
          <p className="font-semibold text-accent-text" data-testid="level-up">
            {gt("levelUp", { level: g.level.level })}
          </p>
        )}
      </Card>

      {unlocked.length > 0 && (
        <Card className="flex flex-col gap-2 p-4" data-testid="new-achievements">
          <h2 className="font-heading text-lg font-bold">{gt("newAchievements")}</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {unlocked.map((a) => (
              <li key={a.code} className="flex items-center gap-2">
                <AchievementIcon code={a.code} className="size-4 text-gold" />
                <span className="font-semibold">{gt(`items.${a.code}.name`)}</span>
                <span className="text-muted">— {gt(`items.${a.code}.desc`)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <form action={repeatWorkout.bind(null, w.id)}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-white"
          >
            <Repeat className="size-4" aria-hidden />
            {h("repeat")}
          </button>
        </form>
        <Link
          href={`/workouts/${w.id}/edit`}
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-surface-2 px-4 text-sm font-semibold"
        >
          <Pencil className="size-4" aria-hidden />
          {h("edit")}
        </Link>
        <DeleteWorkoutButton action={deleteWorkout.bind(null, w.id)} />
      </div>

      {records.length > 0 && (
        <Card className="flex flex-col gap-2 p-4" data-testid="workout-records">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
            <Trophy className="size-5 text-gold" aria-hidden />
            {pr("newRecords")}
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {records.map((r) => (
              <li key={`${r.setId}-${r.type}`} className="flex justify-between gap-3">
                <span>
                  {r.name} · {pr(`recordNames.${r.type}`)}
                </span>
                <span className="font-semibold">{r.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {w.note && (
        <Card>
          <div className="text-xs text-muted">{t("note")}</div>
          <p className="whitespace-pre-line">{w.note}</p>
        </Card>
      )}

      {w.exercises.map((e) => {
        const f = fieldsForKind(e.exercise.kind);
        return (
          <Card key={e.id} className="flex flex-col gap-2 p-4">
            <h2 className="font-heading text-lg font-bold">{exerciseName(e.exercise, locale)}</h2>
            <ol className="flex flex-col gap-1 text-sm">
              {e.sets.map((s, i) => (
                <li key={s.id} className="flex justify-between gap-3">
                  <span className="text-muted">
                    {i + 1}
                    {s.type !== "working" ? ` · ${t(`types.${s.type}`)}` : ""}
                  </span>
                  <span className="font-semibold">
                    {[
                      f.weight && `${kgToDisplay(s.weightKg, units)} ${unitLabel(units)}`,
                      f.reps && `× ${s.reps}`,
                      f.distance && `${s.distanceKm} km`,
                      f.duration && `${s.durationSec} s`,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </li>
              ))}
            </ol>
            <span className="sr-only">{ex(`muscles.${e.exercise.muscleGroup}`)}</span>
          </Card>
        );
      })}
    </div>
  );
}
