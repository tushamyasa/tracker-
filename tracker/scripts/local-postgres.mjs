// Локальный PostgreSQL для разработки и тестов. Ничего устанавливать не нужно:
// это PGlite (настоящий PostgreSQL, собранный в WebAssembly) с сетевым интерфейсом,
// к нему подключается обычный Prisma по адресу postgresql://...
//
//   npm run db:local              данные сохраняются в папке .pglite (в корне проекта)
//   npm run db:local -- --memory  данные только в памяти, после остановки пропадают (для тестов)
//
// Окно с запущенной командой нужно держать открытым. Остановить: Ctrl+C.
//
// Это замена «настоящему» серверу только для локальной работы: в production используйте
// управляемый PostgreSQL (Neon, Supabase, Vercel Postgres и т. п.).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

export const LOCAL_PG_PORT = Number(process.env.LOCAL_PG_PORT ?? 5433);

/** Адрес для DATABASE_URL. Имя базы и пароль сервером не проверяются, но формат должен быть корректным. */
export const LOCAL_PG_URL = `postgresql://postgres:postgres@127.0.0.1:${LOCAL_PG_PORT}/postgres?connection_limit=1&pgbouncer=true&sslmode=disable`;

export async function startLocalPostgres({ memory = false, port = LOCAL_PG_PORT } = {}) {
  const dataDir = memory ? "memory://" : path.join(process.cwd(), ".pglite");
  const db = await PGlite.create(dataDir);
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 8 });
  await server.start();
  return {
    dataDir,
    port,
    db,
    async stop() {
      await server.stop();
      await db.close();
    },
  };
}

// Запуск из командной строки.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  const memory = process.argv.includes("--memory");
  const pg = await startLocalPostgres({ memory });
  console.log(`PostgreSQL (PGlite) запущен: ${LOCAL_PG_URL}`);
  console.log(memory ? "Данные в памяти." : `Данные: ${pg.dataDir}`);
  console.log("Остановить: Ctrl+C");
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 1 << 30); // держим процесс живым
}
