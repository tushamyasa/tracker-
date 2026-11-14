import { expect, test, type Page } from "@playwright/test";

const unique = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const PASSWORD = "E2e-test-pass-1";

async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Повторите пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function addTransaction(
  page: Page,
  opts: { type?: "Доход" | "Расход"; amount: string; category: string; note?: string },
) {
  await page.getByRole("button", { name: "Операция", exact: true }).click();
  const drawer = page.locator('[data-slot="sheet-content"]');
  if (opts.type) await drawer.getByRole("radio", { name: opts.type, exact: true }).click();
  await drawer.getByLabel("Сумма").fill(opts.amount);
  await drawer.getByRole("radio", { name: opts.category, exact: true }).click();
  if (opts.note) await drawer.getByLabel("Заметка").fill(opts.note);
  await drawer.getByRole("button", { name: "Сохранить" }).click();
  await expect(drawer).toBeHidden();
}

test.describe("десктоп: основной сценарий", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("регистрация → категория → операции → фильтры → экспорт → выход/вход", async ({ page }) => {
    const email = `user-${unique()}@example.com`;
    await register(page, email);

    // категории по умолчанию созданы, добавляем свою
    await page.getByRole("link", { name: "Категории", exact: true }).click();
    await expect(page.getByText("Продукты")).toBeVisible();
    await page.getByRole("button", { name: "Категория", exact: true }).click();
    await page.getByLabel("Название").fill("Спорт");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Категория добавлена")).toBeVisible();
    await expect(page.getByRole("tabpanel").getByText("Спорт", { exact: true })).toBeVisible();

    // дубль
    await page.getByRole("button", { name: "Категория", exact: true }).click();
    await page.getByLabel("Название").fill("спорт");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Категория с таким названием уже есть")).toBeVisible();
    await page.keyboard.press("Escape");

    // операции
    await page.getByRole("link", { name: "Операции", exact: true }).click();
    await expect(page.getByText("Операций пока нет").first()).toBeVisible();
    await addTransaction(page, { amount: "1 234,56", category: "Продукты", note: "Хлеб и молоко" });
    await addTransaction(page, { amount: "300", category: "Спорт", note: "Абонемент" });
    await addTransaction(page, { type: "Доход", amount: "100000", category: "Зарплата" });

    const rows = page.locator("tbody tr:visible");
    await expect(rows).toHaveCount(3);
    await expect(page.getByRole("cell", { name: /1 234,56/ })).toBeVisible();

    // валидация формы
    await page.getByRole("button", { name: "Операция", exact: true }).click();
    await page.locator('[data-slot="sheet-content"]').getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Введите сумму больше нуля")).toBeVisible();
    await expect(page.getByText("Выберите категорию")).toBeVisible();
    await page.keyboard.press("Escape");

    // поиск без учёта регистра кириллицы
    await page.getByLabel("Поиск по заметке").fill("ХЛЕБ");
    await expect(rows).toHaveCount(1);
    await page.getByRole("button", { name: "Сбросить фильтры" }).click();
    await expect(rows).toHaveCount(3);

    // фильтр по типу
    await page.getByLabel("Тип", { exact: true }).selectOption("income");
    await expect(rows).toHaveCount(1);
    await page.getByRole("button", { name: "Сбросить фильтры" }).click();

    // редактирование
    await page.getByRole("button", { name: "Редактировать операцию" }).first().click();
    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer.getByText("Редактировать операцию")).toBeVisible();
    await drawer.getByLabel("Сумма").fill("500");
    await drawer.getByRole("button", { name: "Сохранить" }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("cell", { name: /500,00/ })).toBeVisible();

    // экспорт CSV
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Экспорт CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^salary-\d{4}-\d{2}-\d{2}\.csv$/);

    // дашборд показывает итоги
    await page.getByRole("link", { name: "Дашборд", exact: true }).click();
    await expect(page.getByText("Динамика по месяцам")).toBeVisible();
    await expect(page.getByText("Последние операции")).toBeVisible();
    await expect(page.getByText(/\+[\s\u00a0\u202f]*500,00/).first()).toBeVisible();

    // удаление
    await page.getByRole("link", { name: "Операции", exact: true }).click();
    await page.getByRole("button", { name: "Удалить операцию" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
    await expect(rows).toHaveCount(2);

    // выход и повторный вход
    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Пароль").fill("wrong-password");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText("Неверный email или пароль")).toBeVisible();

    await page.getByLabel("Пароль").fill(PASSWORD);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("данные пользователей изолированы", async ({ browser }) => {
    const a = await (await browser.newContext({ baseURL: "http://localhost:3100" })).newPage();
    const b = await (await browser.newContext({ baseURL: "http://localhost:3100" })).newPage();

    await register(a, `iso-a-${unique()}@example.com`);
    await a.getByRole("link", { name: "Операции", exact: true }).click();
    await addTransaction(a, { amount: "777", category: "Продукты", note: "секрет-А" });
    await expect(a.getByRole("cell", { name: "секрет-А" })).toBeVisible();

    await register(b, `iso-b-${unique()}@example.com`);
    await b.getByRole("link", { name: "Операции", exact: true }).click();
    await expect(b.getByText("Операций пока нет").first()).toBeVisible();
    await expect(b.getByText("секрет-А")).toHaveCount(0); // ни таблица, ни карточки

    // чужая сессия не получает экспорт первого пользователя
    const csv = await b.request.get("/api/export/csv");
    expect(csv.status()).toBe(200);
    expect(await csv.text()).not.toContain("секрет-А");

    // без сессии экспорт закрыт
    const anon = await browser.newContext({ baseURL: "http://localhost:3100" });
    expect((await anon.request.get("/api/export/csv")).status()).toBe(401);
  });

  test("защищённые страницы перенаправляют на вход", async ({ page }) => {
    for (const path of ["/dashboard", "/transactions", "/categories", "/reports", "/settings"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe("телефон", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("нижняя навигация, FAB и bottom-sheet", async ({ page }) => {
    await register(page, `mobile-${unique()}@example.com`);

    const nav = page.getByRole("navigation", { name: "Основная навигация" });
    await expect(nav).toBeVisible();
    await expect(page.locator("aside")).toBeHidden();

    await page.getByRole("button", { name: "Добавить операцию" }).click();
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toHaveAttribute("data-side", "bottom");
    await sheet.getByLabel("Сумма").fill("250");
    await sheet.getByRole("radio", { name: "Транспорт", exact: true }).click();
    await sheet.getByRole("button", { name: "Сохранить" }).click();
    await expect(sheet).toBeHidden();

    await nav.getByRole("link", { name: "Операции", exact: true }).click();
    await expect(page.getByText("Транспорт").first()).toBeVisible();

    // нет горизонтальной прокрутки
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);

    // меню «Ещё»
    await nav.getByRole("button", { name: "Ещё" }).click();
    await expect(page.getByRole("link", { name: "Отчёты" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Настройки" })).toBeVisible();
  });
});








