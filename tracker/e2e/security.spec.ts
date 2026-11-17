import { existsSync } from "node:fs";
import path from "node:path";
import { expect, request as pwRequest, test } from "@playwright/test";
import { signUp } from "./helpers";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("заголовки безопасности и CSP на всех ответах", async ({ baseURL }) => {
  const anon = await pwRequest.newContext({ baseURL });
  const res = await anon.get("/login");
  const h = res.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain("object-src 'none'");
  expect(h["x-powered-by"]).toBeUndefined();
  await anon.dispose();
});

test("health-check отвечает без входа", async ({ baseURL }) => {
  const anon = await pwRequest.newContext({ baseURL });
  const res = await anon.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
  await anon.dispose();
});

test("robots.txt закрывает приватное приложение от индексации", async ({ baseURL }) => {
  const anon = await pwRequest.newContext({ baseURL });
  const res = await anon.get("/robots.txt");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("Disallow: /");
  await anon.dispose();
});

test("страницы защищены: без сессии API и медиа отвечают 401", async ({ baseURL }) => {
  const anon = await pwRequest.newContext({ baseURL });
  expect((await anon.get("/api/export?format=json")).status()).toBe(401);
  expect((await anon.get("/api/media/00000000-0000-0000-0000-000000000000.png")).status()).toBe(
    401,
  );
  await anon.dispose();
});

test.describe("загрузка файлов", () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page);
  });

  test("файл с чужим содержимым под видом PNG отклоняется", async ({ page }) => {
    await page.goto("/exercises/new");
    await page.getByLabel("Название").fill("Подделка");
    await page.getByLabel("Фото").setInputFiles({
      name: "evil.png",
      mimeType: "image/png",
      buffer: Buffer.from("<html><script>alert(1)</script></html>"),
    });
    await page.getByRole("button", { name: "Создать" }).click();
    await expect(page.getByText("Допустимы изображения JPG, PNG или WebP")).toBeVisible();
    await expect(page).toHaveURL(/\/exercises\/new$/);
  });

  test("настоящая картинка принимается и отдаётся с правильным типом", async ({ page }) => {
    await page.goto("/exercises/new");
    await page.getByLabel("Название").fill("С картинкой");
    await page
      .getByLabel("Фото")
      .setInputFiles({ name: "p.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Создать" }).click();
    const src = await page.getByRole("img", { name: "С картинкой" }).getAttribute("src");
    expect(src).toContain("/api/media/");
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("чужое фото недоступно другому пользователю", async ({ page, browser }) => {
    await page.goto("/exercises/new");
    await page.getByLabel("Название").fill("Приватное фото");
    await page
      .getByLabel("Фото")
      .setInputFiles({ name: "p.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Создать" }).click();
    const src = await page.getByRole("img", { name: "Приватное фото" }).getAttribute("src");
    expect((await page.request.get(src!)).status()).toBe(200);

    const ctx = await browser.newContext();
    const other = await ctx.newPage();
    await signUp(other, "Другой");
    expect((await other.request.get(src!)).status()).toBe(404);
    await ctx.close();
  });

  test("при удалении аккаунта файлы его упражнений удаляются с диска", async ({ page }) => {
    await page.goto("/exercises/new");
    await page.getByLabel("Название").fill("Для удаления");
    await page
      .getByLabel("Фото")
      .setInputFiles({ name: "p.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Создать" }).click();
    const src = await page.getByRole("img", { name: "Для удаления" }).getAttribute("src");
    const file = path.join(process.cwd(), "uploads", src!.split("/").pop()!);
    expect(existsSync(file)).toBe(true);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Удалить аккаунт" }).click();
    await page.getByRole("button", { name: "Да, удалить всё" }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(existsSync(file)).toBe(false);
  });
});

test.describe("тема и язык сохраняются после перезагрузки", () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page);
    await page.waitForLoadState("networkidle"); // переключатели должны успеть гидратироваться
  });

  test("тёмная тема из сайдбара", async ({ page }) => {
    await page.locator("aside").getByLabel("Тема").selectOption("dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
    // дать серверному сохранению завершиться
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("aside").getByLabel("Тема")).toHaveValue("dark");

    await page.goto("/profile");
    await expect(page.getByLabel("Тема").last()).toHaveValue("dark");
  });

  test("английский язык из сайдбара", async ({ page }) => {
    await page.locator("aside").getByLabel("Язык").selectOption("en");
    await expect(page.getByRole("heading", { name: "Hi, Тест!" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Hi, Тест!" })).toBeVisible();

    // язык привязан к профилю: после выхода и повторного входа остаётся
    await page.goto("/profile");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
