import { describe, expect, it } from "vitest";
import { moveItem, STARTERS } from "@/lib/templates";
import { SEED_EXERCISES } from "../prisma/exercises-data";

describe("moveItem", () => {
  it("меняет соседние элементы местами", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
  });
  it("не выходит за границы и не мутирует исходный массив", () => {
    const src = ["a", "b"];
    expect(moveItem(src, 0, -1)).toBe(src);
    expect(moveItem(src, 1, 1)).toBe(src);
    moveItem(src, 0, 1);
    expect(src).toEqual(["a", "b"]);
  });
});

describe("STARTERS", () => {
  const slugs = new Set(SEED_EXERCISES.map((e) => e[0]));
  it("ссылаются только на существующие упражнения", () => {
    for (const s of STARTERS) for (const [slug] of s.items) expect(slugs, slug).toContain(slug);
  });
  it("имеют уникальные ключи и непустые списки", () => {
    expect(new Set(STARTERS.map((s) => s.key)).size).toBe(STARTERS.length);
    for (const s of STARTERS) expect(s.items.length).toBeGreaterThan(0);
  });
});
