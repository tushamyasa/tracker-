import { defineConfig } from "@playwright/test";

// E2E идут против production-сборки: в dev-режиме первые обращения к страницам
// компилируются на лету, и тесты нестабильны (клик до гидратации формы).
//
// Три сервера:
//  :5545 — временный PostgreSQL в памяти (PGlite); при каждом запуске база чистая;
//  :3000 — приложение с открытым режимом входа (AUTH_MODE=open), основные тесты;
//  :3001 — приложение с входом по ссылке из письма (AUTH_MODE=email), тесты из e2e/email.
// Оба экземпляра приложения используют одну сборку и одну базу.
const DB_PORT = 5545;
const DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres?connection_limit=1&pgbouncer=true&sslmode=disable`;
const SECRET = "e2e-only-secret-0123456789-abcdefghijklmnop";

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
      command: `node scripts/local-postgres.mjs --memory`,
      port: DB_PORT,
      reuseExistingServer: false,
      env: { LOCAL_PG_PORT: String(DB_PORT) },
      timeout: 120_000,
    },
    {
      command: `node scripts/wait-for-port.mjs ${DB_PORT} && npx prisma migrate deploy && npm run db:seed && npm run build && npm run start`,
      url: "http://localhost:3000/login",
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL,
        // Тесты создают десятки аккаунтов с одного адреса, а production-сборка требует настоящий секрет.
        AUTH_RATE_LIMIT: "100000",
        SESSION_SECRET: SECRET,
      },
      timeout: 360_000,
    },
    {
      command: "node e2e/start-email-server.mjs",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
      env: { DATABASE_URL },
      timeout: 420_000,
    },
  ],
});
