"use client";

import clsx from "clsx";
import { Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import type { PickerExercise } from "@/components/templates/TemplateEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { filterExercises } from "@/lib/exercises";
import { toLocalInput } from "@/lib/history";
import { displayToKg, kgToDisplay, type Units } from "@/lib/units";
import { fieldsForKind, type SetType } from "@/lib/workout-types";
import type { FormState } from "@/server/actions/auth";
import { NumInput } from "./NumInput";

interface EditSet {
  uid: string;
  type: SetType;
  weightKg: number;
  reps: number;
  durationSec: number;
  distanceKm: number;
}
interface EditExercise {
  uid: string;
  exerciseId: string;
  sets: EditSet[];
}

export interface WorkoutEditorValues {
  name: string;
  /** ISO-строка начала; null — «сейчас» (для новой тренировки). */
  startedAt: string | null;
  durationMin: number;
  note: string;
  feeling: number | null;
  exercises: {
    exerciseId: string;
    sets: Omit<EditSet, "uid">[];
  }[];
}

let counter = 0;
const uid = () => `u${Date.now()}_${counter++}`;
const NEXT_TYPE: Record<SetType, SetType> = {
  working: "warmup",
  warmup: "failure",
  failure: "working",
};

export function WorkoutEditor({
  action,
  values,
  catalog,
  units,
  submitLabel,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  values: WorkoutEditorValues;
  catalog: PickerExercise[];
  units: Units;
  submitLabel: string;
}) {
  const t = useTranslations("history");
  const w = useTranslations("workout");
  const ex = useTranslations("exercises");

  const [name, setName] = useState(values.name);
  const [startedAt, setStartedAt] = useState(""); // локальное время, заполняется после монтирования
  const [durationMin, setDurationMin] = useState(values.durationMin);
  const [note, setNote] = useState(values.note);
  const [feeling, setFeeling] = useState<number | null>(values.feeling);
  const [items, setItems] = useState<EditExercise[]>(() =>
    values.exercises.map((e) => ({
      uid: uid(),
      exerciseId: e.exerciseId,
      sets: e.sets.map((s) => ({ ...s, uid: uid() })),
    })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [q, setQ] = useState("");

  // Часовой пояс известен только в браузере, поэтому дату выставляем после монтирования.
  useEffect(() => {
    setStartedAt(toLocalInput(values.startedAt ? new Date(values.startedAt) : new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = new Map(catalog.map((c) => [c.id, c]));
  const startedIso = startedAt ? new Date(startedAt).toISOString() : "";
  const payload = JSON.stringify({
    name,
    startedAt: startedIso,
    durationMin,
    note,
    feeling,
    exercises: items.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets.map(({ type, weightKg, reps, durationSec, distanceKm }) => ({
        type,
        weightKg,
        reps,
        durationSec,
        distanceKm,
      })),
    })),
  });

  const patchSet = (exUid: string, setUid: string, patch: Partial<EditSet>) =>
    setItems((list) =>
      list.map((e) =>
        e.uid !== exUid
          ? e
          : { ...e, sets: e.sets.map((s) => (s.uid === setUid ? { ...s, ...patch } : s)) },
      ),
    );

  const addSet = (exUid: string) =>
    setItems((list) =>
      list.map((e) => {
        if (e.uid !== exUid) return e;
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              uid: uid(),
              type: "working" as SetType,
              weightKg: last?.weightKg ?? 0,
              reps: last?.reps ?? 0,
              durationSec: last?.durationSec ?? 0,
              distanceKm: last?.distanceKm ?? 0,
            },
          ],
        };
      }),
    );

  const matches = filterExercises(catalog, { q }).slice(0, 60);

  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      <input type="hidden" name="payload" value={payload} />

      <Input
        label={t("name")}
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("startedAt")}
          name="startedAt"
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
          required
        />
        <Input
          label={t("durationMin")}
          name="durationMin"
          type="number"
          min={1}
          max={1440}
          value={durationMin}
          onChange={(e) => setDurationMin(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          required
        />
      </div>

      <section aria-label={t("exercises")} className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("exercises")}</h2>
        {items.length === 0 && <p className="text-sm text-muted">{t("noExercises")}</p>}
        {items.map((e) => {
          const c = byId.get(e.exerciseId);
          const f = fieldsForKind(c?.kind ?? "weight_reps");
          return (
            <Card key={e.uid} className="flex flex-col gap-3 p-4" data-testid="edit-exercise">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-lg font-bold">{c?.name ?? "—"}</h3>
                  <div className="text-xs text-muted">
                    {c ? ex(`muscles.${c.muscleGroup}`) : ""}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`${w("removeExercise")}: ${c?.name ?? ""}`}
                  onClick={() => setItems((l) => l.filter((x) => x.uid !== e.uid))}
                  className="grid size-11 shrink-0 place-items-center rounded-control text-danger hover:bg-surface-2"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <ol className="flex flex-col gap-1">
                {e.sets.map((s, i) => (
                  <li key={s.uid} data-testid="edit-set" className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`${w("setType")}: ${w(`types.${s.type}`)}`}
                      onClick={() => patchSet(e.uid, s.uid, { type: NEXT_TYPE[s.type] })}
                      className={clsx(
                        "grid size-11 shrink-0 place-items-center rounded-control text-sm font-bold",
                        s.type === "warmup" && "bg-warning/20 text-warning",
                        s.type === "failure" && "bg-danger/15 text-danger",
                        s.type === "working" && "bg-surface-2 text-muted",
                      )}
                    >
                      {s.type === "warmup" ? "W" : s.type === "failure" ? "F" : i + 1}
                    </button>
                    {f.weight && (
                      <NumInput
                        decimal
                        label={`${w("weight")} ${i + 1}`}
                        value={kgToDisplay(s.weightKg, units)}
                        onCommit={(n) =>
                          patchSet(e.uid, s.uid, { weightKg: displayToKg(n, units) })
                        }
                      />
                    )}
                    {f.reps && (
                      <NumInput
                        label={`${w("reps")} ${i + 1}`}
                        value={s.reps}
                        max={1000}
                        onCommit={(n) => patchSet(e.uid, s.uid, { reps: n })}
                      />
                    )}
                    {f.distance && (
                      <NumInput
                        decimal
                        label={`${w("distance")} ${i + 1}`}
                        value={s.distanceKm}
                        onCommit={(n) => patchSet(e.uid, s.uid, { distanceKm: n })}
                      />
                    )}
                    {f.duration && (
                      <NumInput
                        label={`${w("seconds")} ${i + 1}`}
                        value={s.durationSec}
                        max={86400}
                        onCommit={(n) => patchSet(e.uid, s.uid, { durationSec: n })}
                      />
                    )}
                    <button
                      type="button"
                      aria-label={`${w("deleteSet")} ${i + 1}`}
                      onClick={() =>
                        setItems((l) =>
                          l.map((x) =>
                            x.uid === e.uid
                              ? { ...x, sets: x.sets.filter((y) => y.uid !== s.uid) }
                              : x,
                          ),
                        )
                      }
                      className="grid size-8 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-2"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ol>
              <div>
                <Button type="button" variant="secondary" onClick={() => addSet(e.uid)}>
                  <Plus className="size-4" aria-hidden />
                  {w("addSet")}
                </Button>
              </div>
            </Card>
          );
        })}
        <Button type="button" variant="secondary" size="lg" onClick={() => setPickerOpen(true)}>
          <Plus className="size-5" aria-hidden />
          {w("addExercise")}
        </Button>
      </section>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="hnote" className="text-sm font-medium text-muted">
          {w("note")}
        </label>
        <textarea
          id="hnote"
          value={note}
          rows={2}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-control border border-border bg-surface-2 p-3 text-base"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-muted">{w("feeling")}</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={feeling === n}
              onClick={() => setFeeling(feeling === n ? null : n)}
              className={clsx(
                "size-11 rounded-control font-bold",
                feeling === n ? "bg-accent text-white" : "bg-surface-2",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <Sheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={w("pickTitle")}
        description={w("pickText")}
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
                  onClick={() => {
                    setItems((l) => [
                      ...l,
                      {
                        uid: uid(),
                        exerciseId: m.id,
                        sets: [
                          {
                            uid: uid(),
                            type: "working",
                            weightKg: 0,
                            reps: 0,
                            durationSec: 0,
                            distanceKm: 0,
                          },
                        ],
                      },
                    ]);
                    setPickerOpen(false);
                    setQ("");
                  }}
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
    </ActionForm>
  );
}
