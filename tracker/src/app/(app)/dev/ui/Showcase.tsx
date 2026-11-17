"use client";

import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Chip, EmptyState, Skeleton } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Sheet } from "@/components/ui/Sheet";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";

export function UiShowcase() {
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(8);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-extrabold">UI kit</h1>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button size="lg">Large</Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Inputs</h2>
        <Input label="Email" name="email" placeholder="you@example.com" />
        <Input label="With error" name="err" defaultValue="oops" error="Invalid value" />
        <div className="flex flex-wrap gap-8">
          <NumberStepper label="Weight" value={weight} onChange={setWeight} step={2.5} unit="kg" />
          <NumberStepper label="Reps" value={reps} onChange={setReps} />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Chips, tabs, skeleton</h2>
        <div className="flex gap-2">
          <Chip>Chest</Chip>
          <Chip active>Back</Chip>
        </div>
        <Tabs
          items={[
            { value: "a", label: "Week", content: <p>Week content</p> },
            { value: "b", label: "Month", content: <p>Month content</p> },
          ]}
        />
        <Skeleton className="h-6 w-1/2" />
      </Card>

      <Card className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open sheet
        </Button>
        <Button variant="secondary" onClick={() => toast("Saved", "success")}>
          Toast
        </Button>
      </Card>
      <Sheet open={open} onOpenChange={setOpen} title="Sheet" description="Bottom sheet / modal">
        <Button onClick={() => setOpen(false)}>OK</Button>
      </Sheet>

      <EmptyState
        icon={<Dumbbell className="size-8" aria-hidden />}
        title="No workouts yet"
        text="Start your first workout."
        action={<Button>Start</Button>}
      />
    </div>
  );
}
