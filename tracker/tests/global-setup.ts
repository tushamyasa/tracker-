import { exec } from "node:child_process";
import { promisify } from "node:util";
import { startLocalPostgres } from "../scripts/local-postgres.mjs";

const run = promisify(exec);
const PORT = 5544;
const URL = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?connection_limit=1&pgbouncer=true&sslmode=disable`;

/**
 * Для интеграционных тестов поднимается настоящий PostgreSQL в памяти (PGlite) и применяются
 * реальные миграции проекта. Воркеры тестов наследуют DATABASE_URL.
 *
 * Миграции запускаются асинхронно: сервер PGlite живёт в этом же процессе, и синхронный
 * вызов заблокировал бы цикл событий, так что Prisma не смогла бы подключиться.
 */
export default async function setup() {
  const pg = await startLocalPostgres({ memory: true, port: PORT });
  process.env.DATABASE_URL = URL;
  await run("npx prisma migrate deploy", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: URL },
  });
  return async () => {
    await pg.stop();
  };
}
