import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

async function startEmpty(page: Page) {
  await page.goto("/workout/active");
  await page.getByRole("button", { name: "Пустая тренировка" }).click();
  await expect(page.getByTestId("stopwatch")).toBeVisible();
}

async function addExercise(page: Page, search: string) {
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill(search);
  await page
    .getByRole("button", { name: new RegExp(`^${search}`) })
    .first()
    .click();
}

test("полный цикл: старт → подходы → таймер отдыха → перезагрузка → завершение", async ({
  page,
}) => {
  await startEmpty(page);
  await addExercise(page, "Жим штанги лёжа");

  const rows = page.getByTestId("set-row");
  await expect(rows).toHaveCount(1);
  await page.getByRole("textbox", { name: "Вес 1" }).fill("100");
  await page.getByRole("textbox", { name: "Повторы 1" }).fill("5");
  await page.getByRole("button", { name: "Выполнен 1" }).click();

  // таймер отдыха запустился (по умолчанию 90 сек)
  await expect(page.getByTestId("rest-remaining")).toHaveText(/1:(29|30)/);
  await page.getByRole("button", { name: "Плюс 15 секунд" }).click();
  await expect(page.getByTestId("rest-remaining")).toHaveText(/1:(44|45)/);
  await page.getByRole("button", { name: "Пропустить отдых" }).click();
  await expect(page.getByTestId("rest-remaining")).toHaveCount(0);

  // второй подход берёт значения предыдущего
  await page.getByRole("button", { name: "Подход", exact: true }).click();
  await expect(rows).toHaveCount(2);
  await expect(page.getByRole("textbox", { name: "Вес 2" })).toHaveValue("100");
  await page.getByRole("textbox", { name: "Повторы 2" }).fill("4");
  await page.getByRole("button", { name: "Выполнен 2" }).click();
  await expect(page.getByTestId("summary-line")).toHaveText("Выполнено 2 из 2");

  // автосохранение: перезагрузка не теряет данные
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByTestId("set-row")).toHaveCount(2);
  await expect(page.getByRole("textbox", { name: "Повторы 2" })).toHaveValue("4");
  await expect(page.getByTestId("summary-line")).toHaveText("Выполнено 2 из 2");

  // завершение: 100×5 + 100×4 = 900
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\/workouts\/[a-z0-9]+\?done=1$/);
  await expect(page.getByTestId("stat-volume")).toContainText("900");
  await expect(page.getByTestId("stat-sets")).toHaveText("2");
  await expect(page.getByText("Жим штанги лёжа")).toBeVisible();

  // активной тренировки больше нет
  await page.goto("/workout/active");
  await expect(page.getByRole("button", { name: "Пустая тренировка" })).toBeVisible();
});

test("невыполненные подходы не сохраняются, пустую тренировку завершить нельзя", async ({
  page,
}) => {
  await startEmpty(page);
  await addExercise(page, "Приседания со штангой");
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page.getByText("Отметьте хотя бы один выполненный подход")).toBeVisible();
});

test("старт из шаблона и подсказка «прошлый раз»", async ({ page }) => {
  // готовый шаблон «Push» → тренировка с 5 упражнениями
  await page.goto("/templates");
  await page.getByRole("button", { name: "Добавить: Push (жимовой день)" }).click();
  await page.getByRole("button", { name: "Начать: Push (жимовой день)" }).click();
  await expect(page.getByTestId("workout-exercise")).toHaveCount(5);

  // отмечаем только первый подход жима; остальное не выполнено
  await page.getByRole("textbox", { name: "Вес 1" }).first().fill("80");
  await page.getByRole("textbox", { name: "Повторы 1" }).first().fill("8");
  await page.getByRole("button", { name: "Выполнен 1" }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\?done=1$/);
  // в историю попало только упражнение с выполненным подходом
  await expect(page.getByTestId("stat-exercises")).toHaveText("1");
  await expect(page.getByTestId("stat-sets")).toHaveText("1");

  // следующая тренировка из того же шаблона подставляет вес и повторы
  await page.goto("/workout/active");
  await page.getByRole("button", { name: "Начать: Push (жимовой день)" }).click();
  await expect(page.getByRole("textbox", { name: "Вес 1" }).first()).toHaveValue("80");
  await expect(page.getByRole("textbox", { name: "Повторы 1" }).first()).toHaveValue("8");
});

test("отмена тренировки удаляет её", async ({ page }) => {
  await startEmpty(page);
  await addExercise(page, "Становая тяга");
  await page.getByRole("button", { name: "Отменить тренировку" }).click();
  await page.getByRole("button", { name: "Да, отменить" }).click();
  await expect(page.getByRole("button", { name: "Пустая тренировка" })).toBeVisible();
});

test("тип подхода переключается, разминка не входит в объём", async ({ page }) => {
  await startEmpty(page);
  await addExercise(page, "Жим штанги лёжа");
  await page.getByRole("textbox", { name: "Вес 1" }).fill("100");
  await page.getByRole("textbox", { name: "Повторы 1" }).fill("10");
  await page.getByRole("button", { name: /Тип подхода/ }).click(); // → разминочный
  await page.getByRole("button", { name: "Выполнен W" }).click();
  await page.getByRole("button", { name: "Подход", exact: true }).click();
  await expect(page.getByTestId("set-row")).toHaveCount(2);
  await page.getByRole("textbox", { name: /Вес/ }).last().fill("50");
  await page
    .getByRole("textbox", { name: /Повторы/ })
    .last()
    .fill("10");
  await page.getByRole("button", { name: /Выполнен 1/ }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page.getByTestId("stat-volume")).toContainText("500");
});

test("чужая тренировка недоступна", async ({ page, browser }) => {
  await startEmpty(page);
  await addExercise(page, "Жим штанги лёжа");
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\/workouts\/[a-z0-9]+\?done=1$/);
  const url = page.url();

  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  const res = await other.goto(url);
  expect(res?.status()).toBe(404);
  await ctx.close();
});

test("упражнение из истории нельзя удалить", async ({ page }) => {
  await page.goto("/exercises/new");
  await page.getByLabel("Название").fill("Моё для истории");
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByRole("heading", { name: "Моё для истории" })).toBeVisible();

  await startEmpty(page);
  await addExercise(page, "Моё для истории");
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\?done=1$/);

  await page.goto("/exercises");
  await page.getByPlaceholder("Поиск упражнения").fill("Моё для истории");
  await expect(page.getByTestId("count")).toHaveText("Найдено: 1");
  await page.getByRole("link", { name: /Моё для истории/ }).click();
  await expect(page.getByRole("heading", { name: "Моё для истории" })).toBeVisible();
  await page.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("button", { name: "Да, удалить" }).click();
  await expect(page.getByText("есть в истории тренировок")).toBeVisible();
});
