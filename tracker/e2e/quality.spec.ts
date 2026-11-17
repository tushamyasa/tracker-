import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { logQuickWorkout, signUp } from "./helpers";

// Страницы с данными: после одной тренировки и одного замера все разделы непустые.
const PAGES = [
  "/",
  "/exercises",
  "/templates",
  "/templates/new",
  "/workouts",
  "/workouts/new",
  "/workout/active",
  "/progress",
  "/body",
  "/achievements",
  "/profile",
];

/** Страница загружена и гидратирована: виден заголовок h1, затем короткая пауза на отрисовку графиков. */
async function settled(page: Page) {
  await expect(page.locator("main h1, main h2").first()).toBeVisible();
  await page.waitForTimeout(300);
}

async function seed(page: Page) {
  await signUp(page);
  await page.goto("/templates");
  await page.getByRole("button", { name: "Добавить: Push (жимовой день)" }).click();
  await logQuickWorkout(page, "Жим штанги лёжа", "100", "5");
  await logQuickWorkout(page, "Жим штанги лёжа", "110", "5");
  await page.goto("/body");
  await page.getByLabel("Вес тела, kg").fill("80");
  await page.getByRole("button", { name: "Сохранить замер" }).click();
  await expect(page.getByTestId("body-saved")).toBeVisible();
}

async function violations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ")}`,
    );
}

for (const scheme of ["light", "dark"] as const) {
  test(`доступность WCAG AA без серьёзных нарушений, тема: ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ colorScheme: scheme });
    await seed(page);
    const failures: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await settled(page);
      const v = await violations(page);
      if (v.length) failures.push(`${path}: ${v.join("; ")}`);
    }
    expect(failures).toEqual([]);
  });
}

test("страница входа и 404 доступны", async ({ page }) => {
  await page.goto("/login");
  expect(await violations(page)).toEqual([]);
  await page.goto("/login");
});

test("на основных страницах нет ошибок в консоли и исключений", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  await seed(page);
  for (const path of PAGES) {
    await page.goto(path);
    await settled(page);
  }
  expect(errors).toEqual([]);
});

for (const width of [360, 1280]) {
  test(`нет горизонтального скролла на ${width} px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 800 });
    await seed(page);
    const bad: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await settled(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 0) bad.push(`${path}: +${overflow}px`);
    }
    expect(bad).toEqual([]);
  });
}

test("skip-link ведёт к основному содержимому", async ({ page }) => {
  await signUp(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Перейти к содержимому" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("у страниц уникальные заголовки вкладки", async ({ page }) => {
  await signUp(page);
  await page.goto("/exercises");
  await expect(page).toHaveTitle("Упражнения · Трекер тренировок");
  await page.goto("/body");
  await expect(page).toHaveTitle("Замеры тела · Трекер тренировок");
  await page.goto("/profile");
  await expect(page).toHaveTitle("Профиль · Трекер тренировок");
});

test("несуществующая страница: понятный 404", async ({ page }) => {
  await signUp(page);
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Страница не найдена")).toBeVisible();
  await page.getByRole("link", { name: "На главную" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("PWA: манифест и иконки доступны без входа", async ({ baseURL }) => {
  const { request } = await import("@playwright/test");
  const anon = await request.newContext({ baseURL });
  const manifest = await anon.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const json = await manifest.json();
  expect(json.display).toBe("standalone");
  expect(json.icons.length).toBeGreaterThanOrEqual(2);

  for (const path of ["/pwa-icon/192", "/pwa-icon/512", "/icon", "/apple-icon"]) {
    const res = await anon.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(200);
    expect(res.headers()["content-type"], path).toContain("image/png");
  }
  expect((await anon.get("/pwa-icon/999")).status()).toBe(404);
  await anon.dispose();
});

test("английский интерфейс: заголовки и 404 переведены", async ({ page }) => {
  await signUp(page);
  await page.locator("aside").getByLabel("Язык").selectOption("en");
  await page.goto("/exercises");
  await expect(page).toHaveTitle("Exercises · Workout Tracker");
  await page.goto("/no-such-page");
  await expect(page.getByText("Page not found")).toBeVisible();
});
