import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

// День недели считается по UTC, как в приложении: 0 = понедельник.
const todayIndex = () => (new Date().getUTCDay() + 6) % 7;
const WEEKDAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

async function createTemplate(
  page: import("@playwright/test").Page,
  name: string,
  weekday: number,
) {
  await page.goto("/templates/new");
  await page.getByLabel("Название").fill(name);
  await page.getByLabel("День недели").selectOption(String(weekday));
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill("Жим штанги лёжа");
  await page
    .getByRole("button", { name: /^Жим штанги лёжа/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Создать шаблон" }).click();
  await expect(page).toHaveURL(/\/templates$/);
}

test("пустая главная: нет плана, нет тренировок, есть теплокарта", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("today-empty")).toBeVisible();
  await expect(page.getByTestId("last-workout")).toContainText("Пока нет завершённых тренировок");
  await expect(page.getByTestId("body-card")).toContainText("Добавьте первый замер");
  await expect(page.getByTestId("home-heatmap")).toBeVisible();
});

test("«Сегодня по плану»: шаблон на сегодняшний день запускает тренировку", async ({ page }) => {
  await createTemplate(page, "План на сегодня", todayIndex());
  await createTemplate(page, "План на другой день", (todayIndex() + 3) % 7);

  await page.goto("/");
  const plan = page.getByTestId("today-plan");
  await expect(plan).toContainText("План на сегодня");
  await expect(plan).not.toContainText("План на другой день");

  await plan.getByRole("button", { name: "Начать: План на сегодня" }).click();
  await expect(page).toHaveURL(/\/workout\/active$/);
  await expect(page.getByTestId("workout-exercise")).toHaveCount(1);

  // во время тренировки на главной виден баннер возврата
  await page.goto("/");
  await expect(page.getByTestId("active-banner")).toBeVisible();
});

test("шаблон на другой день недели в плане на сегодня не показывается", async ({ page }) => {
  await createTemplate(page, "Только завтра", (todayIndex() + 1) % 7);
  await page.goto("/");
  await expect(page.getByTestId("today-empty")).toBeVisible();
  await expect(page.getByTestId("today-plan")).not.toContainText("Только завтра");
  expect(WEEKDAYS).toHaveLength(7);
});

test("последняя тренировка и активность на главной", async ({ page }) => {
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
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await expect(page).toHaveURL(/\?done=1$/);

  await page.goto("/");
  await expect(page.getByTestId("last-workout")).toContainText("Тренировка");
  await expect(page.getByTestId("last-workout")).toContainText("500 kg");
  await expect(page.getByTestId("home-heatmap").locator('[data-count="1"]')).toHaveCount(1);
});
