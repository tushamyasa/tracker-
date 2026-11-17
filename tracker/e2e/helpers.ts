import type { Page } from "@playwright/test";

export const uniqueEmail = () => `user${Date.now()}${Math.floor(Math.random() * 100000)}@fake.test`;

/** Создаёт нового пользователя с вымышленным email и проходит онбординг. */
export async function signUp(page: Page, name = "Тест") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByRole("button", { name: "Войти" }).click();
  await page.getByLabel("Имя").fill(name);
  await page.getByRole("button", { name: "Начать" }).click();
  await page.waitForURL(/\/$/);
}

/** Записывает и завершает тренировку с одним упражнением и одним подходом. */
export async function logQuickWorkout(page: Page, exercise: string, weight: string, reps: string) {
  await page.goto("/workout/active");
  await page.getByRole("button", { name: "Пустая тренировка" }).click();
  await page.getByRole("button", { name: "Добавить упражнение" }).click();
  await page.getByRole("searchbox", { name: "Поиск упражнения" }).fill(exercise);
  await page
    .getByRole("button", { name: new RegExp(`^${exercise}`) })
    .first()
    .click();
  await page.getByRole("textbox", { name: "Вес 1" }).fill(weight);
  await page.getByRole("textbox", { name: "Повторы 1" }).fill(reps);
  await page.getByRole("button", { name: "Выполнен 1" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Завершить", exact: true }).click();
  await page.getByRole("button", { name: "Завершить и сохранить" }).click();
  await page.waitForURL(/\?done=1$/);
}
