import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ExerciseFilters } from "@/components/exercises/ExerciseFilters";
import { ExerciseThumb } from "@/components/exercises/ExerciseThumb";
import { FavoriteButton } from "@/components/exercises/FavoriteButton";
import { Chip, EmptyState } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { exerciseName, filterExercises } from "@/lib/exercises";
import { requireUser } from "@/server/auth/session";
import { pageTitle } from "@/lib/page-title";

export async function generateMetadata() {
  return { title: await pageTitle("nav.exercises") };
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string; equipment?: string; fav?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const t = await getTranslations("exercises");
  const locale = await getLocale();

  const [all, favs] = await Promise.all([
    db.exercise.findMany({
      where: { OR: [{ ownerId: null }, { ownerId: user.id }] },
    }),
    db.favoriteExercise.findMany({ where: { userId: user.id } }),
  ]);
  const favoriteIds = new Set(favs.map((f) => f.exerciseId));

  const list = filterExercises(
    all,
    { q: sp.q, muscle: sp.muscle, equipment: sp.equipment, favoritesOnly: sp.fav === "1" },
    favoriteIds,
  ).sort((a, b) => exerciseName(a, locale).localeCompare(exerciseName(b, locale), locale));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 text-2xl font-extrabold sm:text-3xl">{t("title")}</h1>
        <Link
          href="/exercises/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Link>
      </div>

      <ExerciseFilters />

      <p className="text-sm text-muted" data-testid="count">
        {t("found", { count: list.length })}
      </p>

      {list.length === 0 ? (
        <EmptyState title={t("emptyTitle")} text={t("emptyText")} />
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-card bg-surface p-3 pr-1">
              <Link href={`/exercises/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <ExerciseThumb url={e.mediaUrl} alt="" className="w-20 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{exerciseName(e, locale)}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Chip active>{t(`muscles.${e.muscleGroup}`)}</Chip>
                    {e.ownerId && <Chip>{t("custom")}</Chip>}
                  </div>
                </div>
              </Link>
              <FavoriteButton id={e.id} active={favoriteIds.has(e.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
