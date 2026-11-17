import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

async function addExercise(page: Page, search: string, exact: string) {
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill(search);
  await page
    .getByRole("button", { name: new RegExp(`^${exact}`) })
    .first()
    .click();
}

test("создание шаблона с порядком упражнений, редактирование, дублирование, удаление", async ({
  page,
}) => {
  await page.goto("/templates/new");
  await page.getByLabel("Название").fill("Мой день");
  await addExercise(page, "Приседания со штангой", "Приседания со штангой");
  await addExercise(page, "Жим штанги лёжа", "Жим штанги лёжа");

  const items = page.getByTestId("template-item");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText("Приседания со штангой");

  await items.nth(1).getByRole("button", { name: "Выше" }).click();
  await expect(items.nth(0)).toContainText("Жим штанги лёжа");

  await items.nth(0).getByRole("button", { name: "Подходы +" }).click();
  await page.getByLabel("День недели").selectOption("2");
  await page.getByRole("button", { name: "Создать шаблон" }).click();

  await expect(page).toHaveURL(/\/templates$/);
  const card = page.getByTestId("template-card").filter({ hasText: "Мой день" });
  await expect(card).toContainText("2 упражнения");
  await expect(card).toContainText("Среда");
  await expect(card).toContainText("Жим штанги лёжа · Приседания со штангой");

  // редактирование: порядок и число подходов сохранились
  await card.getByRole("link").click();
  await expect(page.getByTestId("template-item").nth(0)).toContainText("Жим штанги лёжа");
  await expect(page.getByRole("textbox", { name: "Подходы" }).first()).toHaveValue("4");
  await page.getByLabel("Название").fill("Мой день 2");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByTestId("template-card").filter({ hasText: "Мой день 2" })).toBeVisible();

  // дублирование
  await page.getByRole("button", { name: /Дублировать: Мой день 2/ }).click();
  await expect(
    page.getByTestId("template-card").filter({ hasText: "Мой день 2 (копия)" }),
  ).toBeVisible();

  // удаление
  await page.getByTestId("template-card").filter({ hasText: "(копия)" }).getByRole("link").click();
  await page.getByRole("button", { name: "Удалить шаблон" }).click();
  await page.getByRole("button", { name: "Да, удалить" }).click();
  await expect(page).toHaveURL(/\/templates$/);
  await expect(page.getByTestId("template-card")).toHaveCount(1);
});

test("пустой шаблон не сохраняется", async ({ page }) => {
  await page.goto("/templates/new");
  await page.getByLabel("Название").fill("Пустой");
  await page.getByRole("button", { name: "Создать шаблон" }).click();
  await expect(page.getByText("Добавьте в шаблон хотя бы одно упражнение")).toBeVisible();
});

test("готовый шаблон добавляется в список", async ({ page }) => {
  await page.goto("/templates");
  await page.getByRole("button", { name: "Добавить: Всё тело" }).click();
  const card = page.getByTestId("template-card").filter({ hasText: "Всё тело" });
  await expect(card).toContainText("5 упражнений");
});

test("папки: создание, назначение шаблона, удаление папки не удаляет шаблон", async ({ page }) => {
  await page.goto("/templates");
  await page.getByLabel("Новая папка").fill("Силовые");
  await page.getByRole("button", { name: "Создать папку" }).click();
  await expect(page.getByRole("heading", { name: "Силовые" })).toBeVisible();

  await page.goto("/templates/new");
  await page.getByLabel("Название").fill("В папке");
  await page.getByLabel("Папка").selectOption({ label: "Силовые" });
  await addExercise(page, "Становая тяга", "Становая тяга");
  await page.getByRole("button", { name: "Создать шаблон" }).click();

  const section = page.getByRole("region", { name: "Силовые" });
  await expect(section.getByTestId("template-card")).toContainText("В папке");

  await page.getByRole("button", { name: "Удалить папку: Силовые" }).click();
  await expect(page.getByRole("region", { name: "Силовые" })).toHaveCount(0);
  await expect(page.getByTestId("template-card").filter({ hasText: "В папке" })).toBeVisible();
});

test("чужой шаблон недоступен", async ({ page, browser }) => {
  await page.goto("/templates");
  await page.getByRole("button", { name: "Добавить: Push (жимовой день)" }).click();
  await page.getByTestId("template-card").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/templates\/[a-z0-9]+$/);
  const url = page.url();

  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  const res = await other.goto(url);
  expect(res?.status()).toBe(404);
  await ctx.close();
});
