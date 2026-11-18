import { Card } from "@/components/ui/card";

export function PagePlaceholder({ title, stage }: { title: string; stage: number }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <Card>
        <p className="text-sm text-muted-foreground">Раздел будет реализован на этапе {stage}.</p>
      </Card>
    </div>
  );
}
