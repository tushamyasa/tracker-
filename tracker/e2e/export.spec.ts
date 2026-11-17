import { expect, test, request as pwRequest } from "@playwright/test";
import { logQuickWorkout, signUp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

test("экспорт требует входа: без сессии 401", async ({ baseURL }) => {
  const anon = await pwRequest.newContext({ baseURL });
  const res = await anon.get("/api/export?format=json");
  expect(res.status()).toBe(401);
  await anon.dispose();
});

test("JSON-экспорт содержит данные пользователя и не содержит чужих", async ({ page, browser }) => {
  // своё упражнение, тренировка и замер
  await page.goto("/exercises/new");
  await page.getByLabel("Название").fill("=Моё упражнение");
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByRole("heading", { name: "=Моё упражнение" })).toBeVisible();
  await logQuickWorkout(page, "Жим штанги лёжа", "100", "5");
  await page.goto("/body");
  await page.getByLabel("Вес тела, kg").fill("80");
  await page.getByRole("button", { name: "Сохранить замер" }).click();
  await expect(page.getByTestId("body-saved")).toBeVisible();

  const res = await page.request.get("/api/export?format=json");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");
  expect(res.headers()["content-disposition"]).toMatch(
    /attachment; filename="workout-tracker-data-\d{4}-\d{2}-\d{2}\.json"/,
  );
  const data = await res.json();
  expect(data.version).toBe(1);
  expect(data.profile.name).toBe("Тест");
  expect(data.customExercises.map((e: { nameRu: string }) => e.nameRu)).toContain(
    "=Моё упражнение",
  );
  expect(data.workouts).toHaveLength(1);
  expect(data.workouts[0].exercises[0].sets[0]).toMatchObject({ weightKg: 100, reps: 5 });
  expect(data.measurements).toHaveLength(1);
  expect(data.achievements.length).toBeGreaterThan(0);

  // у другого пользователя в экспорте пусто
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUp(other, "Другой");
  const otherData = await (await other.request.get("/api/export?format=json")).json();
  expect(otherData.workouts).toHaveLength(0);
  expect(otherData.customExercises).toHaveLength(0);
  expect(otherData.measurements).toHaveLength(0);
  expect(JSON.stringify(otherData)).not.toContain("Моё упражнение");
  await ctx.close();
});

test("CSV подходов: заголовок, строка, BOM, защита от формул", async ({ page }) => {
  await page.goto("/exercises/new");
  await page.getByLabel("Название").fill("=Формула");
  await page.getByRole("button", { name: "Создать" }).click();
  await expect(page.getByRole("heading", { name: "=Формула" })).toBeVisible();
  await logQuickWorkout(page, "=Формула", "60", "8");

  const res = await page.request.get("/api/export?format=csv");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const text = await res.text();
  expect(text.charCodeAt(0)).toBe(0xfeff);
  const lines = text.slice(1).trim().split("\r\n");
  expect(lines[0]).toBe("date,workout,exercise,set,type,weight_kg,reps,duration_sec,distance_km");
  expect(lines).toHaveLength(2);
  expect(lines[1]).toContain("'=Формула"); // формула нейтрализована
  expect(lines[1]).toMatch(/,1,working,60,8,0,0$/);
});

test("CSV замеров", async ({ page }) => {
  await page.goto("/body");
  await page.getByLabel("Дата").fill("2026-01-05");
  await page.getByLabel("Вес тела, kg").fill("82");
  await page.getByLabel("Талия, cm").fill("90");
  await page.getByLabel("Заметка").fill("утро, натощак");
  await page.getByRole("button", { name: "Сохранить замер" }).click();
  await expect(page.getByTestId("body-saved")).toBeVisible();

  const text = await (await page.request.get("/api/export?format=csv&data=measurements")).text();
  const lines = text.slice(1).trim().split("\r\n");
  expect(lines[0]).toBe("date,weight_kg,body_fat_pct,chest_cm,waist_cm,hips_cm,arm_cm,note");
  expect(lines[1]).toBe('2026-01-05,82,,,90,,,"утро, натощак"');
});

test("неизвестный формат — 400, кнопки экспорта есть в профиле", async ({ page }) => {
  expect((await page.request.get("/api/export?format=xml")).status()).toBe(400);
  await page.goto("/profile");
  for (const id of ["export-json", "export-csv-sets", "export-csv-body"]) {
    await expect(page.getByTestId(id)).toHaveAttribute("href", /\/api\/export\?format=/);
  }
});
