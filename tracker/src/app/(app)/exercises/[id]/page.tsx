import { ArrowLeft, Pencil } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseThumb } from "@/components/exercises/ExerciseThumb";
import { FavoriteButton } from "@/components/exercises/FavoriteButton";
import { Card, Chip } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { exerciseName } from "@/lib/exercises";
import { loadHistorySamples } from "@/lib/progress-data";
import { formatRecordValue } from "@/lib/record-format";
import { RECORD_TYPES, scanHistory } from "@/lib/records";
import type { Units } from "@/lib/units";
import { deleteExercise } from "@/server/actions/exercises";
import { requireUser } from "@/server/auth/session";
import { DeleteExerciseButton } from "./DeleteExerciseButton";

export default async function ExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const t = await getTranslations("exercises");
  const locale = await getLocale();

  // Доступны только системные упражнения и собственные.
  const e = await db.exercise.findFirst({
    where: { id, OR: [{ ownerId: null }, { ownerId: user.id }] },
  });
  if (!e) notFound();
  const fav = await db.favoriteExercise.findUnique({
    where: { userId_exerciseId: { userId: user.id, exerciseId: id } },
  });
  const p = await getTranslations("progress");
  const units = user.units as Units;
  const history = await loadHistorySamples(user.id, { exerciseIds: [id] });
  const bests = scanHistory(
    history.map((h) => h.sample),
    e.kind,
  ).bests;
  const isOwner = e.ownerId === user.id;
  const name = exerciseName(e, locale);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/exercises" className="inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft className="size-4" aria-hidden />
        {t("title")}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-extrabold">{name}</h1>
        <FavoriteButton id={e.id} active={!!fav} />
      </div>

      {error === "in_use" && (
        <p role="status" className="rounded-control bg-danger/10 px-4 py-3 text-sm text-danger">
          {t("inUse")}
        </p>
      )}

      <ExerciseThumb url={e.mediaUrl} alt={name} className="w-full max-w-md" />

      <div className="flex flex-wrap gap-2">
        <Chip active>{t(`muscles.${e.muscleGroup}`)}</Chip>
        <Chip>{t(`equipment.${e.equipment}`)}</Chip>
        <Chip>{t(`kinds.${e.kind}`)}</Chip>
        {isOwner && <Chip>{t("custom")}</Chip>}
      </div>

      <Card>
        <h2 className="mb-2 text-lg font-bold">{t("technique")}</h2>
        <p className="whitespace-pre-line text-muted">{e.description || t("noDescription")}</p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-bold">{t("progressTitle")}</h2>
        {history.length === 0 ? (
          <p className="text-muted">{t("progressSoon")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="exercise-records">
              {RECORD_TYPES.filter((r) => bests[r] !== undefined).map((r) => (
                <div key={r}>
                  <dt className="text-xs text-muted">{p(`recordNames.${r}`)}</dt>
                  <dd className="font-heading text-lg font-extrabold">
                    {formatRecordValue(r, bests[r]!, units)}
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/progress?exercise=${e.id}`}
              className="text-sm text-accent-text underline"
            >
              {t("openProgress")}
            </Link>
          </div>
        )}
      </Card>

      {isOwner && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/exercises/${e.id}/edit`}
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-surface-2 px-4 text-sm font-semibold"
          >
            <Pencil className="size-4" aria-hidden />
            {t("edit")}
          </Link>
          <DeleteExerciseButton action={deleteExercise.bind(null, e.id)} />
        </div>
      )}
    </div>
  );
}
