import { defineConfig } from "@playwright/test";

// E2E идут против production-сборки: в dev-режиме первые обращения к страницам
// компилируются на лету, и тесты нестабильны (клик до гидратации формы).
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
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
});
