import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

async function addMeasurement(page: Page, date: string, fields: Record<string, string>) {
  await page.goto("/body");
  await page.getByLabel("Дата").fill(date);
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label).fill(value);
  }
  await page.getByRole("button", { name: "Сохранить замер" }).click();
  await expect(page.getByTestId("body-saved")).toBeVisible();
}

test("пустая страница замеров", async ({ page }) => {
  await page.goto("/body");
  await expect(page.getByTestId("body-empty")).toBeVisible();
});

test("замеры: сохранение, последние значения, изменение, график, таблица", async ({ page }) => {
  await addMeasurement(page, "2026-01-05", { "Вес тела, kg": "82", "Талия, cm": "90" });
  await addMeasurement(page, "2026-01-12", { "Вес тела, kg": "80,5" });

  await expect(page.getByTestId("latest-weight")).toHaveText("80.5 kg");
  await expect(page.getByTestId("delta-weight")).toHaveText("-1.5 kg");
  await expect(page.getByTestId("latest-waist")).toHaveText("90 cm");

  await expect(page.getByTestId("progress-chart")).toBeVisible();
  await page.getByText("Показать таблицей").click();
  await expect(page.getByTestId("body-chart-table").locator("tr")).toHaveCount(2);

  // переключение показателя
  await page.getByLabel("Показатель").selectOption("waist");
  await expect(page.getByRole("heading", { name: "Талия, cm" })).toBeVisible();
  await page.getByLabel("Показатель").selectOption("hips");
  await expect(page.getByTestId("body-chart-empty")).toBeVisible();

  await expect(page.getByTestId("body-history").locator("li")).toHaveCount(2);
});

test("повторный ввод на ту же дату дополняет запись, а не создаёт новую", async ({ page }) => {
  await addMeasurement(page, "2026-02-01", { "Вес тела, kg": "81" });
  await addMeasurement(page, "2026-02-01", { "Жир, %": "18" });
  await expect(page.getByTestId("body-history").locator("li")).toHaveCount(1);
  await expect(page.getByTestId("body-history")).toContainText("Вес тела 81 kg");
  await expect(page.getByTestId("body-history")).toContainText("Жир 18 %");
});

test("валидация: пустой замер, значение вне диапазона, дата в будущем", async ({ page }) => {
  await page.goto("/body");
  await page.getByRole("button", { name: "Сохранить замер" }).click();
  await expect(page.getByText("Заполните хотя бы один показатель")).toBeVisible();

  await page.getByLabel("Вес тела, kg").fill("5");
  await page.getByRole("button", { name: "Сохранить замер" }).click();
  await expect(page.getByText("Значение вне допустимого диапазона")).toBeVisible();

  await page.getByLabel("Вес тела, kg").fill("80");
  await page.getByLabel("Дата").fill("2099-01-01");
  await page.getByRole("button", { name: "Сохранить замер" }).click();
  await expect(page.getByText("Дата замера не может быть в будущем")).toBeVisible();
});

test("удаление замера", async ({ page }) => {
  await addMeasurement(page, "2026-03-01", { "Вес тела, kg": "79" });
  await page.getByRole("button", { name: /Удалить замер/ }).click();
  await expect(page.getByTestId("body-empty")).toBeVisible();
});

test("первый замер открывает достижение, замеры на главной", async ({ page }) => {
  await addMeasurement(page, "2026-03-01", { "Вес тела, kg": "79" });
  await page.goto("/achievements");
  await expect(
    page.locator('[data-testid="ach-unlocked"][data-code="first_measurement"]'),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.getByTestId("home-weight")).toHaveText("79 kg");
});

test("пользователь с фунтами вводит и видит вес в lb и обхваты в дюймах", async ({ page }) => {
  await page.goto("/profile");
  await page.getByLabel("Единицы веса").selectOption("lb");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Изменения сохранены")).toBeVisible();

  await addMeasurement(page, "2026-01-05", { "Вес тела, lb": "180", "Талия, in": "36" });
  await expect(page.getByTestId("latest-weight")).toHaveText("180 lb");
  await expect(page.getByTestId("latest-waist")).toHaveText("36 in");
});

test("чужие замеры не видны", async ({ page, browser }) => {
  await addMeasurement(page, "2026-01-05", { "Вес тела, kg": "82" });
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  await other.goto("/body");
  await expect(other.getByTestId("body-empty")).toBeVisible();
  await ctx.close();
});
