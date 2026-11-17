import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

async function logWorkout(
  page: Page,
  exercise: string,
  sets: { weight: string; reps: string }[],
): Promise<void> {
  await page.goto("/workout/active");
  await page.getByRole("button", { name: "Пустая тренировка" }).click();
  await expect(page.getByTestId("stopwatch")).toBeVisible();
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill(exercise);
  await page
    .getByRole("button", { name: new RegExp(`^${exercise}`) })
    .first()
    .click();
  for (let i = 0; i < sets.length; i++) {
    if (i > 0) {
      await page.getByRole("button", { name: "Подход", exact: true }).click();
      await expect(page.getByTestId("set-row")).toHaveCount(i + 1);
    }
    await page.getByRole("textbox", { name: `Вес ${i + 1}` }).fill(sets[i].weight);
    await page.getByRole("textbox", { name: `Повторы ${i + 1}` }).fill(sets[i].reps);
    await page.getByRole("button", { name: `Выполнен ${i + 1}` }).click();
  }
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\?done=1$/);
}

test("пустая страница прогресса приглашает начать тренировку", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByText("Здесь появятся графики")).toBeVisible();
});

test("первая тренировка рекордом не считается, вторая с большим весом — считается", async ({
  page,
}) => {
  await logWorkout(page, "Жим штанги лёжа", [{ weight: "100", reps: "5" }]);
  await expect(page.getByTestId("workout-records")).toHaveCount(0);

  // вторая тренировка: PR-метка появляется сразу при отметке подхода
  await page.goto("/workout/active");
  await page.getByRole("button", { name: "Пустая тренировка" }).click();
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill("Жим штанги лёжа");
  await page
    .getByRole("button", { name: /^Жим штанги лёжа/ })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Вес 1" }).fill("100");
  await page.getByRole("textbox", { name: "Повторы 1" }).fill("5");
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await expect(page.getByTestId("pr-badge")).toHaveCount(0); // ровно прошлый результат

  await page.getByRole("button", { name: "Подход", exact: true }).click();
  await expect(page.getByTestId("set-row")).toHaveCount(2);
  await page.getByRole("textbox", { name: "Вес 2" }).fill("110");
  await page.getByRole("button", { name: "Выполнен 2" }).click();
  await expect(page.getByTestId("pr-badge")).toHaveCount(1);
  await expect(page.getByTestId("pr-badge")).toContainText("вес");

  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page.getByTestId("workout-records")).toContainText("Жим штанги лёжа · Макс. вес");
  await expect(page.getByTestId("workout-records")).toContainText("110");
});

test("страница прогресса: рекорды, график, таблица, теплокарта, группы мышц, лента", async ({
  page,
}) => {
  await logWorkout(page, "Жим штанги лёжа", [{ weight: "100", reps: "5" }]);
  await logWorkout(page, "Жим штанги лёжа", [{ weight: "105", reps: "5" }]);

  await page.goto("/progress");
  await expect(page.getByTestId("progress-chart")).toBeVisible();
  await expect(page.getByTestId("record-weight")).toHaveText("105 kg");
  await expect(page.getByTestId("record-volume")).toHaveText("525 kg");

  // график даёт точки, таблица дублирует данные и помечает рекорд
  await page.getByText("Показать таблицей").click();
  const rows = page.getByTestId("chart-table").locator("tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("105");
  await expect(rows.nth(1)).toContainText("🏆");

  // теплокарта: один день с двумя тренировками
  await expect(page.getByTestId("heatmap-days")).toHaveText("1 день с тренировкой");
  await expect(page.getByTestId("heatmap").locator('[data-count="2"]')).toHaveCount(1);

  // группы мышц и лента рекордов
  await expect(page.getByTestId("muscle-list")).toContainText("Грудь");
  await expect(page.getByTestId("records-feed")).toContainText("Жим штанги лёжа");
  await expect(page.getByTestId("records-feed")).toContainText("105");
});

test("переключение показателя и периода на странице прогресса", async ({ page }) => {
  await logWorkout(page, "Жим штанги лёжа", [{ weight: "100", reps: "5" }]);
  await page.goto("/progress");
  await page.getByLabel("Показатель").selectOption("e1rm");
  await expect(page.getByRole("heading", { name: /Расчётный 1RM/ })).toBeVisible();
  await page.getByLabel("Показатель").selectOption("volume");
  await expect(page.getByRole("heading", { name: /Объём за тренировку/ })).toBeVisible();
  await page.getByLabel("Период").selectOption("week");
  await expect(page.getByTestId("progress-chart")).toBeVisible();
});

test("рекорды на карточке упражнения и пересчёт после удаления тренировки", async ({ page }) => {
  await logWorkout(page, "Приседания со штангой", [{ weight: "120", reps: "5" }]);
  await logWorkout(page, "Приседания со штангой", [{ weight: "140", reps: "3" }]);
  const lastUrl = page.url().split("?")[0];

  await page.goto("/exercises");
  await page.getByPlaceholder("Поиск упражнения").fill("Приседания со штангой");
  await expect(page.getByTestId("count")).toHaveText("Найдено: 1");
  await page.getByRole("link", { name: /Приседания со штангой/ }).click();
  await expect(page.getByTestId("exercise-records")).toContainText("140");

  // удаляем рекордную тренировку: максимум возвращается к прежнему
  await page.goto(lastUrl);
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  await page.getByRole("button", { name: "Да, удалить" }).click();
  await expect(page).toHaveURL(/\/workouts$/);

  await page.goto("/progress");
  await expect(page.getByTestId("record-weight")).toHaveText("120 kg");
});

test("чужие данные не попадают в прогресс", async ({ page, browser }) => {
  await logWorkout(page, "Жим штанги лёжа", [{ weight: "200", reps: "1" }]);
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  await other.goto("/progress");
  await expect(other.getByText("Здесь появятся графики")).toBeVisible();
  await ctx.close();
});
