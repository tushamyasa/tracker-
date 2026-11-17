import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("главная открывается на русском и переключается на английский", async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole("heading", { name: "Привет, Тест!" })).toBeVisible();
  await page.locator("aside").getByLabel("Язык").selectOption("en");
  await expect(page.getByRole("heading", { name: "Hi, Тест!" })).toBeVisible();
});
