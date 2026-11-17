import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
  await page.goto("/exercises");
});

test("каталог показывает 100+ упражнений, поиск и фильтры работают", async ({ page }) => {
  await expect(page.getByTestId("count")).toContainText(/Найдено: 1\d\d/);

  await page.getByPlaceholder("Поиск упражнения").fill("ЖИМ ШТАНГИ");
  await expect(page.getByRole("link", { name: /Жим штанги лёжа/ })).toBeVisible();
  await expect(page.getByTestId("count")).toContainText("Найдено:");

  await page.getByPlaceholder("Поиск упражнения").fill("");
  await page.getByRole("button", { name: "Икры" }).click();
  await expect(page.getByTestId("count")).toHaveText("Найдено: 4");

  await page.getByRole("button", { name: "Все", exact: true }).click();
  await expect(page.getByTestId("count")).toContainText(/Найдено: 1\d\d/);
  await page.getByLabel("Оборудование").selectOption("kettlebell");
  await expect(page.getByTestId("count")).toHaveText("Найдено: 3");
});

test("избранное: добавление и фильтр", async ({ page }) => {
  await page.getByPlaceholder("Поиск упражнения").fill("Приседания со штангой");
  await expect(page.getByTestId("count")).toHaveText("Найдено: 1");
  await page.getByRole("button", { name: "Добавить в избранное" }).click();
  await expect(page.getByRole("button", { name: "Убрать из избранного" })).toBeVisible();

  await page.getByPlaceholder("Поиск упражнения").fill("");
  await page.getByRole("button", { name: "★ Избранное" }).click();
  await expect(page.getByTestId("count")).toHaveText("Найдено: 1");
});

test("своё упражнение: создание, редактирование, удаление", async ({ page }) => {
  await page.getByRole("link", { name: "Добавить" }).click();
  await page.getByLabel("Название").fill("Мой жим");
  await page.getByLabel("Группа мышц").selectOption("chest");
  await page.getByLabel("Описание техники").fill("Лопатки сведены");
  await page.getByRole("button", { name: "Создать" }).click();

  await expect(page.getByRole("heading", { name: "Мой жим" })).toBeVisible();
  await expect(page.getByText("Лопатки сведены")).toBeVisible();

  await page.getByRole("link", { name: "Редактировать" }).click();
  await page.getByLabel("Название").fill("Мой жим 2");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name: "Мой жим 2" })).toBeVisible();

  await page.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("button", { name: "Да, удалить" }).click();
  await expect(page).toHaveURL(/\/exercises$/);
  await page.getByPlaceholder("Поиск упражнения").fill("Мой жим");
  await expect(page.getByTestId("count")).toHaveText("Найдено: 0");
});

test("фото упражнения загружается и отображается", async ({ page }) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  await page.goto("/exercises/new");
  await page.getByLabel("Название").fill("С фото");
  await page
    .getByLabel("Фото")
    .setInputFiles({ name: "p.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Создать" }).click();
  const img = page.getByRole("img", { name: "С фото" });
  await expect(img).toBeVisible();
  const src = await img.getAttribute("src");
  expect(src).toContain("/api/media/");
});

test("нельзя открыть, менять или удалять чужое упражнение", async ({ page, browser }) => {
  await page.goto("/exercises/new");
  await page.getByLabel("Название").fill("Секретное");
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByRole("heading", { name: "Секретное" })).toBeVisible();
  const url = page.url();

  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  const res = await other.goto(url);
  expect(res?.status()).toBe(404);
  const edit = await other.goto(url + "/edit");
  expect(edit?.status()).toBe(404);
  await ctx.close();
});

test("системное упражнение нельзя редактировать", async ({ page }) => {
  await page.getByPlaceholder("Поиск упражнения").fill("Становая тяга");
  await page
    .getByRole("link", { name: /^Становая тяга$|Становая тяга(?! сумо)/ })
    .first()
    .click();
  await expect(page.getByRole("link", { name: "Редактировать" })).toHaveCount(0);
});
