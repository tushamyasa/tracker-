import { Play } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ActiveWorkout } from "@/components/workout/ActiveWorkout";
import { Card, Chip } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { pickerExercises } from "@/lib/template-data";
import type { Units } from "@/lib/units";
import { getActiveWorkout } from "@/lib/workout-data";
import { startWorkout } from "@/server/actions/workouts";
import { requireUser } from "@/server/auth/session";
import { pageTitle } from "@/lib/page-title";

export async function generateMetadata() {
  return { title: await pageTitle("nav.start") };
}

export default async function ActiveWorkoutPage() {
  const user = await requireUser();
  const t = await getTranslations("workout");
  const locale = await getLocale();

  const active = await getActiveWorkout(user.id, locale);
  if (active) {
    const exercises = await pickerExercises(user.id, locale);
    return (
      <ActiveWorkout
        workout={active}
        exercises={exercises}
        units={user.units as Units}
        restDefaultSec={user.restDefaultSec}
        effectsEnabled={user.effectsEnabled}
      />
    );
  }

  const templates = await db.template.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("startTitle")}</h1>

      <form action={startWorkout.bind(null, null)}>
        <button
          type="submit"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-control bg-accent px-6 text-base font-semibold text-white"
        >
          <Play className="size-5" aria-hidden />
          {t("startEmpty")}
        </button>
      </form>

      <section aria-label={t("fromTemplate")} className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("fromTemplate")}</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-muted">
            {t("noTemplates")}{" "}
            <Link href="/templates" className="text-accent-text underline">
              {t("goTemplates")}
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {templates.map((tpl) => (
              <li key={tpl.id}>
                <Card className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-heading font-bold">{tpl.name}</div>
                    <Chip className="mt-1">{t("exerciseCount", { count: tpl._count.items })}</Chip>
                  </div>
                  <form action={startWorkout.bind(null, tpl.id)}>
                    <button
                      type="submit"
                      aria-label={`${t("start")}: ${tpl.name}`}
                      className="min-h-11 rounded-control bg-accent px-4 text-sm font-semibold text-white"
                    >
                      {t("start")}
                    </button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
