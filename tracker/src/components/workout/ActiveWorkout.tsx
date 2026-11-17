"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { fireConfetti } from "@/lib/confetti";
import { filterExercises } from "@/lib/exercises";
import {
  mergeBests,
  metricsOf,
  newRecords,
  type Bests,
  type RecordType,
  type SetSample,
} from "@/lib/records";
import { unitLabel, type Units } from "@/lib/units";
import {
  fieldsForKind,
  workoutVolume,
  type ActiveWorkoutDTO,
  type SetDTO,
  type SetValues,
  type WorkoutExerciseDTO,
} from "@/lib/workout-types";
import {
  addExerciseToWorkout,
  addSet,
  cancelWorkout,
  deleteSet,
  finishWorkout,
  removeWorkoutExercise,
  updateSet,
  updateWorkoutNote,
} from "@/server/actions/workouts";
import type { PickerExercise } from "@/components/templates/TemplateEditor";
import { RestTimer } from "./RestTimer";
import { SetRow } from "./SetRow";
import { Stopwatch } from "./Stopwatch";

const SAVE_DELAY_MS = 500;

/** Рекорды по подходам упражнения: сравниваем с историей и с предыдущими подходами этой тренировки. */
function recordsFor(e: WorkoutExerciseDTO): Map<string, RecordType[]> {
  const out = new Map<string, RecordType[]>();
  let prior: Bests = e.bests ?? {};
  e.sets.forEach((s, i) => {
    if (!s.done) return;
    const sample: SetSample = {
      id: s.id,
      workoutId: "active",
      at: i,
      type: s.type,
      weightKg: s.weightKg,
      reps: s.reps,
      durationSec: s.durationSec,
      distanceKm: s.distanceKm,
    };
    const types = newRecords(prior, sample, e.kind);
    if (types.length > 0) out.set(s.id, types);
    prior = mergeBests(prior, metricsOf(sample, e.kind));
  });
  return out;
}

export function ActiveWorkout({
  workout,
  exercises: catalog,
  units,
  restDefaultSec,
  effectsEnabled,
}: {
  workout: ActiveWorkoutDTO;
  exercises: PickerExercise[];
  units: Units;
  restDefaultSec: number;
  effectsEnabled: boolean;
}) {
  const t = useTranslations("workout");
  const ex = useTranslations("exercises");
  const toast = useToast();
  const [items, setItems] = useState<WorkoutExerciseDTO[]>(workout.exercises);
  const [note, setNote] = useState(workout.note);
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [q, setQ] = useState("");
  const [finishOpen, setFinishOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [feeling, setFeeling] = useState<number | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // --- Автосохранение подходов -------------------------------------------------
  // Всегда отправляем подход целиком, поэтому порядок запросов не страшен;
  // запросы по одному подходу выстраиваются в цепочку.
  const itemsRef = useRef(items);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const chains = useRef(new Map<string, Promise<unknown>>());

  const commit = (fn: (list: WorkoutExerciseDTO[]) => WorkoutExerciseDTO[]) => {
    const next = fn(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
  };

  const findSet = (setId: string): SetDTO | undefined =>
    itemsRef.current.flatMap((e) => e.sets).find((s) => s.id === setId);

  const saveSet = useCallback(
    (setId: string) => {
      const s = findSet(setId);
      if (!s) return Promise.resolve();
      const prev = chains.current.get(setId) ?? Promise.resolve();
      const next = prev.then(async () => {
        const res = await updateSet(workout.id, setId, {
          type: s.type,
          weightKg: s.weightKg,
          reps: s.reps,
          durationSec: s.durationSec,
          distanceKm: s.distanceKm,
          done: s.done,
        });
        if (!res.ok) toast(t("saveError"), "error");
      });
      chains.current.set(
        setId,
        next.catch(() => {}),
      );
      return next.catch(() => toast(t("saveError"), "error"));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workout.id],
  );

  const scheduleSave = useCallback(
    (setId: string, immediate = false) => {
      const old = timers.current.get(setId);
      if (old) clearTimeout(old);
      if (immediate) {
        timers.current.delete(setId);
        void saveSet(setId);
        return;
      }
      timers.current.set(
        setId,
        setTimeout(() => {
          timers.current.delete(setId);
          void saveSet(setId);
        }, SAVE_DELAY_MS),
      );
    },
    [saveSet],
  );

  const flushAll = useCallback(async () => {
    const ids = [...timers.current.keys()];
    ids.forEach((id) => clearTimeout(timers.current.get(id)));
    timers.current.clear();
    await Promise.all(ids.map((id) => saveSet(id)));
    await Promise.all([...chains.current.values()]);
  }, [saveSet]);

  // Не теряем несохранённое при закрытии вкладки: добиваем запросы.
  useEffect(() => {
    const onHide = () => {
      if (timers.current.size > 0) void flushAll();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flushAll]);

  // --- Операции ------------------------------------------------------------------
  // Обновляем и ref, и состояние сразу: сохранение читает актуальные значения из ref.
  const mutateSet = (weId: string, setId: string, patch: Partial<SetDTO>) => {
    const next = itemsRef.current.map((e) =>
      e.id !== weId
        ? e
        : { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) },
    );
    itemsRef.current = next;
    setItems(next);
  };

  const patchSet = (weId: string, setId: string, patch: Partial<SetValues>) => {
    mutateSet(weId, setId, patch);
    scheduleSave(setId);
  };

  const toggleDone = (weId: string, setId: string) => {
    const current = findSet(setId);
    if (!current) return;
    const done = !current.done;
    mutateSet(weId, setId, { done });
    scheduleSave(setId, true);
    if (done) setRestEnd(Date.now() + restDefaultSec * 1000);
  };

  const onAddSet = async (weId: string) => {
    const s = await addSet(workout.id, weId);
    if (!s) return toast(t("saveError"), "error");
    commit((list) => list.map((e) => (e.id === weId ? { ...e, sets: [...e.sets, s] } : e)));
  };

  const onDeleteSet = async (weId: string, setId: string) => {
    commit((list) =>
      list.map((e) => (e.id === weId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e)),
    );
    const timer = timers.current.get(setId);
    if (timer) clearTimeout(timer);
    timers.current.delete(setId);
    await deleteSet(workout.id, setId);
  };

  const onAddExercise = async (exerciseId: string) => {
    setPickerOpen(false);
    setQ("");
    const dto = await addExerciseToWorkout(workout.id, exerciseId);
    if (!dto) return toast(t("saveError"), "error");
    commit((list) => [...list, dto]);
  };

  const onRemoveExercise = async (weId: string) => {
    commit((list) => list.filter((e) => e.id !== weId));
    await removeWorkoutExercise(workout.id, weId);
  };

  const onFinish = () => {
    setFinishError(null);
    startTransition(async () => {
      await flushAll();
      const res = await finishWorkout(workout.id, feeling);
      if (res?.error) setFinishError(res.error);
    });
  };

  const onCancel = () => {
    startTransition(async () => {
      await cancelWorkout(workout.id);
    });
  };

  // Конфетти при новом рекорде: рекорды, уже существовавшие при загрузке, не празднуем повторно.
  const recordIds = items.flatMap((e) => [...recordsFor(e).keys()]);
  const celebrated = useRef<Set<string> | null>(null);
  if (celebrated.current === null) celebrated.current = new Set(recordIds);
  const recordKey = recordIds.join(",");
  useEffect(() => {
    const seen = celebrated.current!;
    const fresh = recordIds.filter((id) => !seen.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => seen.add(id));
    if (effectsEnabled) void fireConfetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordKey, effectsEnabled]);

  const allSets = items.flatMap((e) => e.sets);
  const doneCount = allSets.filter((s) => s.done).length;
  const volume = workoutVolume(allSets);
  const matches = filterExercises(catalog, { q }).slice(0, 60);

  return (
    <div className="flex flex-col gap-5 pb-24">
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg font-extrabold">{workout.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted">
            <Stopwatch startedAt={workout.startedAt} />
            <span data-testid="summary-line">
              {t("progressLine", { done: doneCount, total: allSets.length })}
            </span>
          </div>
        </div>
        <Button onClick={() => setFinishOpen(true)}>{t("finish")}</Button>
      </header>

      {items.length === 0 && <p className="text-muted">{t("emptyWorkout")}</p>}

      {items.map((e) => {
        const f = fieldsForKind(e.kind);
        let workingIndex = 0;
        const records = recordsFor(e);
        return (
          <Card key={e.id} className="flex flex-col gap-3 p-4" data-testid="workout-exercise">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate font-heading text-lg font-bold">{e.name}</h2>
                <div className="text-xs text-muted">{ex(`muscles.${e.muscleGroup}`)}</div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveExercise(e.id)}
                aria-label={`${t("removeExercise")}: ${e.name}`}
                className="grid size-11 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-2"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>

            <ol className="flex flex-col gap-1">
              {e.sets.map((s, idx) => {
                if (s.type !== "warmup") workingIndex += 1;
                return (
                  <SetRow
                    key={s.id}
                    set={s}
                    label={s.type === "warmup" ? "W" : String(workingIndex)}
                    kind={e.kind}
                    units={units}
                    prev={e.prev[idx] ?? e.prev[e.prev.length - 1]}
                    onChange={(patch) => patchSet(e.id, s.id, patch)}
                    onToggleDone={() => toggleDone(e.id, s.id)}
                    records={records.get(s.id)}
                    onDelete={() => onDeleteSet(e.id, s.id)}
                  />
                );
              })}
            </ol>
            <div className="flex items-center justify-between">
              <Button variant="secondary" onClick={() => onAddSet(e.id)}>
                <Plus className="size-4" aria-hidden />
                {t("addSet")}
              </Button>
              <span className="text-xs text-muted">{f.weight ? unitLabel(units) : ""}</span>
            </div>
          </Card>
        );
      })}

      <Button variant="secondary" size="lg" onClick={() => setPickerOpen(true)}>
        <Plus className="size-5" aria-hidden />
        {t("addExercise")}
      </Button>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="wnote" className="text-sm font-medium text-muted">
          {t("note")}
        </label>
        <textarea
          id="wnote"
          value={note}
          rows={2}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => void updateWorkoutNote(workout.id, note)}
          className="rounded-control border border-border bg-surface-2 p-3 text-base"
        />
      </div>

      <Button
        variant="ghost"
        className="self-start text-danger"
        onClick={() => setCancelOpen(true)}
      >
        {t("cancel")}
      </Button>

      <RestTimer
        endAt={restEnd}
        onAdjust={(d) => setRestEnd((v) => (v === null ? v : v + d * 1000))}
        onStop={() => setRestEnd(null)}
      />

      <Sheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={t("pickTitle")}
        description={t("pickText")}
      >
        <div className="flex flex-col gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ex("search")}
            aria-label={ex("search")}
            className="min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base"
          />
          <ul className="flex max-h-[50vh] flex-col overflow-y-auto">
            {matches.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onAddExercise(m.id)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-control px-3 text-left hover:bg-surface-2"
                >
                  <span className="truncate">{m.name}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {ex(`muscles.${m.muscleGroup}`)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Sheet>

      <Sheet
        open={finishOpen}
        onOpenChange={setFinishOpen}
        title={t("finishTitle")}
        description={t("finishText", {
          done: doneCount,
          total: allSets.length,
          volume: Math.round(volume),
        })}
      >
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-muted">{t("feeling")}</legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={feeling === n}
                  onClick={() => setFeeling(feeling === n ? null : n)}
                  className={
                    feeling === n
                      ? "size-11 rounded-control bg-accent font-bold text-white"
                      : "size-11 rounded-control bg-surface-2 font-bold"
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          {finishError && (
            <p role="alert" className="text-sm text-danger">
              {t(`errors.${finishError}`)}
            </p>
          )}
          <Button size="lg" loading={pending} onClick={onFinish}>
            {t("finishConfirm")}
          </Button>
          <Button variant="secondary" onClick={() => setFinishOpen(false)}>
            {t("continue")}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("cancelTitle")}
        description={t("cancelText")}
      >
        <div className="flex flex-col gap-3">
          <Button variant="danger" size="lg" loading={pending} onClick={onCancel}>
            {t("cancelConfirm")}
          </Button>
          <Button variant="secondary" onClick={() => setCancelOpen(false)}>
            {t("continue")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
