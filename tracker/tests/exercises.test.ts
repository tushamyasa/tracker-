import { describe, expect, it } from "vitest";
import { exerciseName, filterExercises } from "@/lib/exercises";
import { SEED_EXERCISES } from "../prisma/exercises-data";

const list = [
  {
    id: "1",
    nameRu: "Жим штанги лёжа",
    nameEn: "Barbell Bench Press",
    muscleGroup: "chest",
    equipment: "barbell",
  },
  { id: "2", nameRu: "Приседания", nameEn: "Squat", muscleGroup: "quads", equipment: "barbell" },
  {
    id: "3",
    nameRu: "Отжимания",
    nameEn: "Push-Up",
    muscleGroup: "chest",
    equipment: "bodyweight",
  },
];

describe("filterExercises", () => {
  it("ищет по кириллице без учёта регистра", () => {
    expect(filterExercises(list, { q: "ЖИМ ШТ" }).map((e) => e.id)).toEqual(["1"]);
  });
  it("ищет по английскому названию независимо от языка", () => {
    expect(filterExercises(list, { q: "push" }).map((e) => e.id)).toEqual(["3"]);
  });
  it("фильтрует по группе мышц и оборудованию", () => {
    expect(filterExercises(list, { muscle: "chest", equipment: "bodyweight" })).toHaveLength(1);
  });
  it("показывает только избранное", () => {
    expect(filterExercises(list, { favoritesOnly: true }, new Set(["2"])).map((e) => e.id)).toEqual(
      ["2"],
    );
  });
  it("выбирает название по языку", () => {
    expect(exerciseName(list[0], "en")).toBe("Barbell Bench Press");
    expect(exerciseName(list[0], "ru")).toBe("Жим штанги лёжа");
  });
});

describe("seed data", () => {
  it("содержит не менее 100 упражнений с уникальными slug", () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(SEED_EXERCISES.map((e) => e[0])).size).toBe(SEED_EXERCISES.length);
  });
  it("использует только допустимые группы, оборудование и типы", async () => {
    const { MUSCLE_GROUPS, EQUIPMENT, KINDS } = await import("@/lib/exercises");
    for (const [slug, , , m, eq, k] of SEED_EXERCISES) {
      expect(MUSCLE_GROUPS, slug).toContain(m);
      expect(EQUIPMENT, slug).toContain(eq);
      expect(KINDS, slug).toContain(k);
    }
  });
});
