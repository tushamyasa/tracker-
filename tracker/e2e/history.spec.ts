import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

/** Быстро записывает завершённую тренировку через экран активной тренировки. */
async function logWorkout(page: Page, exercise: string, weight: string, reps: string) {
  await page.goto("/workout/active");
  await page.getByRole("button", { name: "Пустая тренировка" }).click();
  await expect(page.getByTestId("stopwatch")).toBeVisible();
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill(exercise);
  await page
    .getByRole("button", { name: new RegExp(`^${exercise}`) })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Вес 1" }).fill(weight);
  await page.getByRole("textbox", { name: "Повторы 1" }).fill(reps);
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\?done=1$/);
}

test("пустая история, затем тренировка появляется в списке", async ({ page }) => {
  await page.goto("/workouts");
  await expect(page.getByText("Пока нет тренировок")).toBeVisible();

  await logWorkout(page, "Жим штанги лёжа", "100", "5");
  await page.goto("/workouts");
  await expect(page.getByTestId("history-count")).toHaveText("Тренировок: 1");
  const card = page.getByTestId("history-card");
  await expect(card).toContainText("500");
  await expect(card).toContainText("Жим штанги лёжа");
});

test("фильтр по упражнению и периоду", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");
  await logWorkout(page, "Приседания со штангой", "120", "5");
  await page.goto("/workouts");
  await expect(page.getByTestId("history-count")).toHaveText("Тренировок: 2");

  await page.getByLabel("Упражнение").selectOption({ label: "Приседания со штангой" });
  await expect(page.getByTestId("history-count")).toHaveText("Тренировок: 1");
  await expect(page.getByTestId("history-card")).toContainText("Приседания со штангой");

  await page.getByLabel("Упражнение").selectOption({ label: "Любое" });
  await expect(page.getByTestId("history-count")).toHaveText("Тренировок: 2");
  await page.getByLabel("Период").selectOption("week");
  await expect(page.getByTestId("history-count")).toHaveText("Тренировок: 2");
});

test("редактирование пересчитывает объём", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");
  await page.getByRole("link", { name: "Редактировать" }).click();
  await expect(page.getByRole("textbox", { name: "Повторы 1" })).toHaveValue("5");
  await page.getByRole("textbox", { name: "Повторы 1" }).fill("8");
  await page.getByLabel("Название").fill("Правленая");
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page).toHaveURL(/\/workouts\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: "Правленая" })).toBeVisible();
  await expect(page.getByTestId("stat-volume")).toContainText("800");
});

test("повторить тренировку создаёт активную с теми же значениями", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "90", "6");
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page).toHaveURL(/\/workout\/active$/);
  await expect(page.getByRole("textbox", { name: "Вес 1" })).toHaveValue("90");
  await expect(page.getByRole("textbox", { name: "Повторы 1" })).toHaveValue("6");
  // подходы пока не выполнены
  await expect(page.getByTestId("summary-line")).toHaveText("Выполнено 0 из 1");
});

test("удаление тренировки", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await page.getByRole("button", { name: "Да, удалить" }).click();
  await expect(page).toHaveURL(/\/workouts$/);
  await expect(page.getByText("Пока нет тренировок")).toBeVisible();
});

test("тренировка задним числом", async ({ page }) => {
  await page.goto("/workouts/new");
  await page.getByLabel("Название").fill("Вчерашняя");
  await page.getByLabel("Начало").fill("2026-01-10T18:30");
  await page.getByLabel("Длительность, мин").fill("45");
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill("Становая тяга");
  await page
    .getByRole("button", { name: /^Становая тяга Спина/ })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Вес 1" }).fill("140");
  await page.getByRole("textbox", { name: "Повторы 1" }).fill("3");
  await page.getByRole("button", { name: "Добавить тренировку" }).click();

  await expect(page.getByRole("heading", { name: "Вчерашняя" })).toBeVisible();
  await expect(page.getByTestId("stat-volume")).toContainText("420");
  await expect(page.getByTestId("stat-duration")).toHaveText("45:00");
});

test("дата в будущем отклоняется, тренировка без упражнений не создаётся", async ({ page }) => {
  await page.goto("/workouts/new");
  await page.getByLabel("Начало").fill("2099-01-01T10:00");
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill("Становая тяга");
  await page
    .getByRole("button", { name: /^Становая тяга Спина/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Добавить тренировку" }).click();
  await expect(page.getByText("не может быть в будущем")).toBeVisible();
});

test("чужую тренировку нельзя ни открыть, ни править", async ({ page, browser }) => {
  await logWorkout(page, "Жим штанги лёжа", "100", "5");
  const url = page.url().split("?")[0];

  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  expect((await other.goto(url))?.status()).toBe(404);
  expect((await other.goto(url + "/edit"))?.status()).toBe(404);
  await ctx.close();
});
