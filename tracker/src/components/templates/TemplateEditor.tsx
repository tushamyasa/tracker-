"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Sheet } from "@/components/ui/Sheet";
import { filterExercises } from "@/lib/exercises";
import { moveItem } from "@/lib/templates";
import type { FormState } from "@/server/actions/auth";

export interface PickerExercise {
  id: string;
  name: string;
  nameRu: string;
  nameEn: string;
  muscleGroup: string;
  equipment: string;
  kind: string;
}

interface Item {
  uid: string;
  exerciseId: string;
  sets: number;
  reps: number;
}

export interface TemplateValues {
  name: string;
  note: string;
  weekday: number | null;
  folderId: string | null;
  items: { exerciseId: string; sets: number; reps: number }[];
}

let counter = 0;
const uid = () => `i${Date.now()}_${counter++}`;

export function TemplateEditor({
  action,
  values,
  exercises,
  folders,
  submitLabel,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  values: TemplateValues;
  exercises: PickerExercise[];
  folders: { id: string; name: string }[];
  submitLabel: string;
}) {
  const t = useTranslations("templates");
  const ex = useTranslations("exercises");
  const [name, setName] = useState(values.name);
  const [note, setNote] = useState(values.note);
  const [weekday, setWeekday] = useState<number | null>(values.weekday);
  const [folderId, setFolderId] = useState<string | null>(values.folderId);
  const [items, setItems] = useState<Item[]>(() => values.items.map((i) => ({ ...i, uid: uid() })));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [q, setQ] = useState("");

  const byId = new Map(exercises.map((e) => [e.id, e]));
  const payload = JSON.stringify({
    name,
    note,
    weekday,
    folderId,
    items: items.map(({ exerciseId, sets, reps }) => ({ exerciseId, sets, reps })),
  });

  const update = (u: string, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.uid === u ? { ...i, ...patch } : i)));

  const matches = filterExercises(exercises, { q }).slice(0, 60);
  const select = "min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base";

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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="weekday" className="text-sm font-medium text-muted">
            {t("weekday")}
          </label>
          <select
            id="weekday"
            className={select}
            value={weekday ?? ""}
            onChange={(e) => setWeekday(e.target.value === "" ? null : Number(e.target.value))}
          >
            <option value="">{t("noWeekday")}</option>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>
                {t(`weekdays.${d}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="folder" className="text-sm font-medium text-muted">
            {t("folder")}
          </label>
          <select
            id="folder"
            className={select}
            value={folderId ?? ""}
            onChange={(e) => setFolderId(e.target.value || null)}
          >
            <option value="">{t("noFolder")}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className="text-sm font-medium text-muted">
          {t("note")}
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          className="rounded-control border border-border bg-surface-2 p-3 text-base"
        />
      </div>

      <section aria-label={t("exercisesTitle")} className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("exercisesTitle")}</h2>
        {items.length === 0 && <p className="text-sm text-muted">{t("noItems")}</p>}
        <ol className="flex flex-col gap-3">
          {items.map((item, idx) => {
            const e = byId.get(item.exerciseId);
            return (
              <li key={item.uid}>
                <Card className="flex flex-col gap-3 p-4" data-testid="template-item">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{e?.name ?? "—"}</div>
                      <div className="text-xs text-muted">
                        {e ? ex(`muscles.${e.muscleGroup}`) : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0">
                      <button
                        type="button"
                        aria-label={t("moveUp")}
                        disabled={idx === 0}
                        onClick={() => setItems((l) => moveItem(l, idx, -1))}
                        className="grid size-11 place-items-center rounded-control hover:bg-surface-2 disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t("moveDown")}
                        disabled={idx === items.length - 1}
                        onClick={() => setItems((l) => moveItem(l, idx, 1))}
                        className="grid size-11 place-items-center rounded-control hover:bg-surface-2 disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t("removeItem")}
                        onClick={() => setItems((l) => l.filter((i) => i.uid !== item.uid))}
                        className="grid size-11 place-items-center rounded-control text-danger hover:bg-surface-2"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <NumberStepper
                      label={t("sets")}
                      value={item.sets}
                      min={1}
                      max={20}
                      onChange={(v) => update(item.uid, { sets: v })}
                    />
                    <NumberStepper
                      label={t("reps")}
                      value={item.reps}
                      min={1}
                      max={100}
                      onChange={(v) => update(item.uid, { reps: v })}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
        <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
          <Plus className="size-4" aria-hidden />
          {t("addExercise")}
        </Button>
      </section>

      <Sheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={t("pickTitle")}
        description={t("pickText")}
      >
        <div className="flex flex-col gap-3">
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ex("search")}
            aria-label={ex("search")}
            className="min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base"
          />
          <ul className="flex max-h-[50vh] flex-col overflow-y-auto">
            {matches.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    setItems((l) => [...l, { uid: uid(), exerciseId: e.id, sets: 3, reps: 10 }]);
                    setPickerOpen(false);
                    setQ("");
                  }}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-control px-3 text-left hover:bg-surface-2"
                >
                  <span className="truncate">{e.name}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {ex(`muscles.${e.muscleGroup}`)}
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="p-3 text-sm text-muted">{ex("emptyTitle")}</li>}
          </ul>
        </div>
      </Sheet>
    </ActionForm>
  );
}
