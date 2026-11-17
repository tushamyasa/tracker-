import { defineConfig } from "@playwright/test";

// E2E идут против production-сборки: в dev-режиме первые обращения к страницам
// компилируются на лету, и тесты нестабильны (клик до гидратации формы).
//
// Два сервера на одной сборке:
//  :3000 — открытый режим входа (AUTH_MODE=open), основные тесты;
//  :3001 — вход по ссылке из письма (AUTH_MODE=email), тесты из e2e/email.
export default defineConfig({
  projects: [
    {
      name: "app",
      testDir: "./e2e",
      testIgnore: ["email/**"],
      use: { baseURL: "http://localhost:3000" },
    },
    {
      name: "email",
      testDir: "./e2e/email",
      use: { baseURL: "http://localhost:3001" },
    },
  ],
  webServer: [
    {
      command: "npm run build && npm run start",
      url: "http://localhost:3000/login",
      reuseExistingServer: !process.env.CI,
      env: {
        // Тесты создают десятки аккаунтов с одного адреса, а production-сборка требует настоящий секрет.
        AUTH_RATE_LIMIT: "100000",
        SESSION_SECRET: "e2e-only-secret-0123456789-abcdefghijklmnop",
      },
      timeout: 240_000,
    },
    {
      command: "node e2e/start-email-server.mjs",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
});
