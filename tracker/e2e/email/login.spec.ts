import { expect, test, type Page } from "@playwright/test";
import { countMails, linkFrom, uniqueEmail, waitForMail } from "./mailbox";

async function requestLink(page: Page, email: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Получить ссылку" }).click();
  await expect(page.getByTestId("link-sent")).toBeVisible();
}

async function finishOnboarding(page: Page, name = "Почтовый") {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Имя").fill(name);
  await page.getByRole("button", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("запрос ссылки: письмо уходит, но вход не выполняется до открытия ссылки", async ({
  page,
}) => {
  const email = uniqueEmail();
  await requestLink(page, email);
  await expect(page.getByTestId("link-sent")).toContainText(email);

  const mail = await waitForMail(email);
  expect(mail.subject).toBe("Ссылка для входа в Трекер тренировок");
  expect(linkFrom(mail)).toMatch(/^http:\/\/localhost:3001\/auth\/verify\?token=[\w-]{40,}$/);

  // сессии нет: защищённые страницы по-прежнему ведут на вход
  await page.goto("/exercises");
  await expect(page).toHaveURL(/\/login$/);
});

test("вход по ссылке: открытие не расходует токен, вход завершается кнопкой", async ({ page }) => {
  const email = uniqueEmail();
  await requestLink(page, email);
  const link = linkFrom(await waitForMail(email));

  // почтовый сканер или предпросмотр открывают ссылку — токен должен остаться рабочим
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Подтвердите вход" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Подтвердите вход" })).toBeVisible();
  await page.goto("/exercises");
  await expect(page).toHaveURL(/\/login$/); // всё ещё без сессии

  await page.goto(link);
  await page.getByRole("button", { name: "Войти" }).click();
  await finishOnboarding(page);
  await page.goto("/profile");
  await expect(page.getByText(email)).toBeVisible();
});

test("ссылка одноразовая: повторное использование отклоняется", async ({ page, browser }) => {
  const email = uniqueEmail();
  await requestLink(page, email);
  const link = linkFrom(await waitForMail(email));

  await page.goto(link);
  await page.getByRole("button", { name: "Войти" }).click();
  await finishOnboarding(page);

  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await other.goto(link);
  await expect(other.getByTestId("link-invalid")).toBeVisible();
  await expect(other.getByText("Ссылка не работает")).toBeVisible();
  // и в чужом браузере сессии нет
  await other.goto("/");
  await expect(other).toHaveURL(/\/login$/);
  await ctx.close();
});

test("подделанный и пустой токен отклоняются", async ({ page }) => {
  const email = uniqueEmail();
  await requestLink(page, email);
  const link = linkFrom(await waitForMail(email));
  const forged = link.slice(0, -1) + (link.endsWith("A") ? "B" : "A");

  await page.goto(forged);
  await expect(page.getByTestId("link-invalid")).toBeVisible();
  await page.goto("/auth/verify");
  await expect(page.getByTestId("link-invalid")).toBeVisible();
  await page.goto("/auth/verify?token=abc");
  await expect(page.getByTestId("link-invalid")).toBeVisible();
});

test("вернувшийся пользователь попадает на главную, а не на онбординг", async ({ page }) => {
  const email = uniqueEmail();
  await requestLink(page, email);
  await page.goto(linkFrom(await waitForMail(email)));
  await page.getByRole("button", { name: "Войти" }).click();
  await finishOnboarding(page);

  await page.goto("/profile");
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);

  const before = await countMails(email);
  await requestLink(page, email);
  // ждём именно новое письмо, а не первое
  await expect.poll(() => countMails(email)).toBe(before + 1);
  await page.goto(linkFrom(await waitForMail(email)));
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Привет, Почтовый!" })).toBeVisible();
});

test("ответ одинаков для нового и существующего адреса: аккаунты не перечисляются", async ({
  page,
}) => {
  const email = uniqueEmail();
  await requestLink(page, email);
  const newText = await page.getByTestId("link-sent").innerText();
  await page.goto(linkFrom(await waitForMail(email)));
  await page.getByRole("button", { name: "Войти" }).click();
  await finishOnboarding(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await requestLink(page, email);
  expect(await page.getByTestId("link-sent").innerText()).toBe(newText);
});

test("лимит: больше 5 писем на один адрес за 15 минут не отправляется", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  for (let i = 0; i < 5; i++) {
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Получить ссылку" }).click();
    await expect(page.getByTestId("link-sent")).toBeVisible();
    await page.getByRole("button", { name: "Указать другой адрес" }).click();
  }
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Получить ссылку" }).click();
  await expect(page.getByText("Слишком много попыток")).toBeVisible();
  await expect.poll(() => countMails(email)).toBe(5);
});

test("письмо приходит на языке интерфейса", async ({ page, context }) => {
  await context.addCookies([{ name: "locale", value: "en", url: "http://localhost:3001" }]);
  const email = uniqueEmail();
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Get a link" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Get a link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();
  const mail = await waitForMail(email);
  expect(mail.subject).toBe("Your Workout Tracker sign-in link");
  expect(mail.text).toContain("valid for 15 minutes");
});

test("некорректный адрес не отправляет письмо", async ({ page }) => {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("form").evaluate((f: HTMLFormElement) => (f.noValidate = true));
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Получить ссылку" }).click();
  await expect(page.getByText("Введите корректный email")).toBeVisible();
});

test("доступность страниц входа по ссылке (светлая и тёмная тема)", async ({ page }) => {
  const AxeBuilder = (await import("@axe-core/playwright")).default;
  const check = async () =>
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()
    ).violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);

  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const email = uniqueEmail();
    await requestLink(page, email); // экран «проверьте почту»
    expect(await check(), `sent, ${scheme}`).toEqual([]);

    await page.goto(linkFrom(await waitForMail(email))); // подтверждение
    await expect(page.getByRole("heading", { name: "Подтвердите вход" })).toBeVisible();
    expect(await check(), `verify, ${scheme}`).toEqual([]);

    await page.goto("/auth/verify?token=abc"); // недействительная ссылка
    await expect(page.getByTestId("link-invalid")).toBeVisible();
    expect(await check(), `invalid, ${scheme}`).toEqual([]);
  }
});
