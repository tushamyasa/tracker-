import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

async function startWithExercise(page: Page, exercise: string) {
  await page.goto("/workout/active");
  await page.getByRole("button", { name: "Пустая тренировка" }).click();
  await expect(page.getByTestId("stopwatch")).toBeVisible();
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill(exercise);
  await page
    .getByRole("button", { name: new RegExp(`^${exercise}`) })
    .first()
    .click();
}

async function finish(page: Page) {
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\?done=1$/);
}

async function logWorkout(page: Page, exercise: string, weight: string, reps: string) {
  await startWithExercise(page, exercise);
  await page.getByRole("textbox", { name: "Вес 1" }).fill(weight);
  await page.getByRole("textbox", { name: "Повторы 1" }).fill(reps);
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await finish(page);
}

test("новый пользователь: уровень 1, серия 0, цель 0/3", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("level-card")).toContainText("Уровень 1");
  await expect(page.getByTestId("xp-total")).toHaveText("0 / 100 XP");
  await expect(page.getByTestId("streak")).toHaveText("Серия: 0 дней");
  await expect(page.getByTestId("week-count")).toHaveText("0/3");
});

test("первая тренировка: XP, серия, кольцо цели и достижение «Первый шаг»", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");

  // 50 за тренировку + 10 за подход, рекорда ещё нет
  await expect(page.getByTestId("xp-gained")).toHaveText("+60 XP за тренировку");
  await expect(page.getByTestId("new-achievements")).toContainText("Первый шаг");

  await page.goto("/");
  await expect(page.getByTestId("xp-total")).toHaveText("60 / 100 XP");
  await expect(page.getByTestId("streak")).toHaveText("Серия: 1 день");
  await expect(page.getByTestId("week-count")).toHaveText("1/3");
  await expect(page.getByRole("progressbar", { name: "Цель недели" })).toHaveAttribute(
    "aria-valuenow",
    "33",
  );
});

test("рекорд даёт +100 XP, новый уровень и достижение «Личный рекорд»", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5"); // 60 XP
  await logWorkout(page, "Жим штанги лёжа", "110", "5"); // +50 +10 +100 = 160 → 220 XP

  await expect(page.getByTestId("xp-gained")).toHaveText("+160 XP за тренировку");
  await expect(page.getByTestId("level-up")).toContainText("уровень 2");
  await expect(page.getByTestId("new-achievements")).toContainText("Личный рекорд");
  await expect(page.getByTestId("workout-records")).toBeVisible();

  await page.goto("/achievements");
  await expect(page.getByTestId("level-title")).toHaveText("Уровень 2");
  await expect(page.getByTestId("ach-count")).toHaveText("Открыто 2 из 18");
  await expect(
    page.locator('[data-testid="ach-unlocked"][data-code="first_workout"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="ach-unlocked"][data-code="first_record"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="ach-locked"][data-code="streak_7"]')).toBeVisible();
});

test("своё упражнение открывает достижение «Автор»", async ({ page }) => {
  await page.goto("/exercises/new");
  await page.getByLabel("Название").fill("Моё упражнение");
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByRole("heading", { name: "Моё упражнение" })).toBeVisible();
  await page.goto("/achievements");
  await expect(
    page.locator('[data-testid="ach-unlocked"][data-code="custom_exercise"]'),
  ).toBeVisible();
});

test("достижение остаётся после удаления тренировки, а XP пересчитывается", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");
  const url = page.url().split("?")[0];
  await page.goto(url);
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await page.getByRole("button", { name: "Да, удалить" }).click();
  await expect(page).toHaveURL(/\/workouts$/);

  await page.goto("/");
  await expect(page.getByTestId("xp-total")).toHaveText("0 / 100 XP");
  await expect(page.getByTestId("streak")).toHaveText("Серия: 0 дней");
  await page.goto("/achievements");
  await expect(
    page.locator('[data-testid="ach-unlocked"][data-code="first_workout"]'),
  ).toBeVisible();
});

test("конфетти при рекорде в тренировке и отключение эффектов в профиле", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");

  // эффекты включены: при новом рекорде появляется canvas конфетти
  await startWithExercise(page, "Жим штанги лёжа");
  await page.getByRole("textbox", { name: "Вес 1" }).fill("120");
  await page.getByRole("textbox", { name: "Повторы 1" }).fill("5");
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await expect(page.getByTestId("pr-badge")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await finish(page);

  // выключаем эффекты в профиле
  await page.goto("/profile");
  await page.getByLabel("Эффекты и конфетти").uncheck();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Изменения сохранены")).toBeVisible();

  await startWithExercise(page, "Жим штанги лёжа");
  await page.getByRole("textbox", { name: "Вес 1" }).fill("130");
  await page.getByRole("textbox", { name: "Повторы 1" }).fill("5");
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await expect(page.getByTestId("pr-badge")).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("чужие достижения не видны", async ({ page, browser }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  await other.goto("/achievements");
  await expect(other.getByTestId("ach-count")).toHaveText("Открыто 0 из 18");
  await ctx.close();
});
