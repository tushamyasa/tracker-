import { heatLevel, type HeatCell } from "@/lib/progress";
import { HeatmapScroller } from "./HeatmapScroller";

const LEVEL_MIX = [0, 35, 65, 100];

/** Календарь-теплокарта активности: колонки — недели, строки — дни (пн–вс). */
export function Heatmap({
  weeks,
  label,
  cellLabel,
}: {
  weeks: (HeatCell | null)[][];
  label: string;
  cellLabel: (key: string, count: number) => string;
}) {
  return (
    <HeatmapScroller>
      <div role="img" aria-label={label} className="flex gap-[3px]" data-testid="heatmap">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) =>
              cell ? (
                <div
                  key={di}
                  data-count={cell.count}
                  title={cellLabel(cell.key, cell.count)}
                  className="size-3 rounded-[3px]"
                  style={{
                    background: `color-mix(in srgb, var(--accent) ${LEVEL_MIX[heatLevel(cell.count)]}%, var(--surface-2))`,
                  }}
                />
              ) : (
                <div key={di} className="size-3" />
              ),
            )}
          </div>
        ))}
      </div>
    </HeatmapScroller>
  );
}
