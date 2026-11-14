import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Используем установленный Edge, чтобы не скачивать браузеры Playwright.
    // Для Chrome/Chromium замените на channel: "chrome" или уберите channel.
    channel: process.env.E2E_CHANNEL ?? "msedge",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      TURSO_DATABASE_URL: "file:e2e.db",
      TURSO_AUTH_TOKEN: "",
      AUTH_SECRET: "e2e-only-secret-not-for-production",
      AUTH_URL: `http://localhost:${PORT}`,
    },
  },
});
