import type { LucideIcon } from "lucide-react";

/** Временная заглушка раздела до его реализации на соответствующем этапе. */
export function PageStub({
  icon: Icon,
  title,
  stage,
}: {
  icon: LucideIcon;
  title: string;
  stage: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-surface px-6 py-16 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Раздел будет реализован на этапе {stage} плана.
      </p>
    </div>
  );
}
