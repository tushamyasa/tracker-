import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

test.describe("мобильная навигация", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("нижняя панель видна, сайдбар скрыт, переход работает", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Основная навигация" }).first();
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Упражнения" }).click();
    await expect(page).toHaveURL(/\/exercises$/);
    await expect(page.getByRole("heading", { name: "Упражнения" })).toBeVisible();
    const noHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(noHScroll).toBe(true);
  });
});

test.describe("десктопная навигация", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("сайдбар виден, нижней панели нет", async ({ page }) => {
    await page.goto("/");
    const side = page.locator("aside");
    await expect(side).toBeVisible();
    await side.getByRole("link", { name: "Прогресс" }).click();
    await expect(page).toHaveURL(/\/progress$/);
    await expect(page.locator("nav.fixed.bottom-0")).toBeHidden();
  });
});
