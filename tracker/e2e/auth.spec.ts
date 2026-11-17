import { expect, test, type Page } from "@playwright/test";

const uniqueEmail = () => `user${Date.now()}${Math.floor(Math.random() * 1000)}@fake.test`;

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Войти" }).click();
}

test("без сессии редирект на вход", async ({ page }) => {
  await page.goto("/exercises");
  await expect(page).toHaveURL(/\/login$/);
});

test("вымышленный email создаёт аккаунт, повторный вход открывает тот же", async ({ page }) => {
  const email = uniqueEmail();
  await login(page, email);

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Имя").fill("Тест");
  await page.getByRole("button", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/profile");
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, email.toUpperCase());
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/profile");
  await expect(page.getByLabel("Имя")).toHaveValue("Тест");
});

test("некорректный email показывает ошибку", async ({ page }) => {
  await page.goto("/login");
  // отключаем нативную проверку браузера, чтобы проверить серверную валидацию
  await page.locator("form").evaluate((f: HTMLFormElement) => (f.noValidate = true));
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText("Введите корректный email")).toBeVisible();
});

test("настройки профиля сохраняются, язык переключается", async ({ page }) => {
  await login(page, uniqueEmail());
  await page.getByLabel("Имя").fill("Аня");
  await page.getByRole("button", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/profile");
  await page.getByLabel("Язык").last().selectOption("en");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByText("Changes saved")).toBeVisible();
});

test("удаление аккаунта", async ({ page }) => {
  const email = uniqueEmail();
  await login(page, email);
  await page.getByLabel("Имя").fill("Удалить");
  await page.getByRole("button", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/profile");
  await page.waitForLoadState("networkidle"); // дождаться гидратации перед кликом
  await page.getByRole("button", { name: "Удалить аккаунт" }).click();
  await page.getByRole("button", { name: "Да, удалить всё" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, email);
  await expect(page).toHaveURL(/\/onboarding$/); // аккаунт создан заново, данных нет
});
