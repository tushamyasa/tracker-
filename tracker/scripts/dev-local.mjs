// Запуск приложения локально одной командой:   npm run dev:local
//
// Что делает:
//  1. создаёт .env с секретом сессии, если файла ещё нет;
//  2. поднимает локальный PostgreSQL (PGlite, данные в папке .pglite) или подключается к уже запущенному;
//  3. применяет миграции и, если в базе нет упражнений, загружает 112 стартовых;
//  4. запускает dev-сервер Next.js на http://localhost:3000.
//
// Остановить всё: Ctrl+C.
import { exec, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import { LOCAL_PG_PORT, LOCAL_PG_URL, startLocalPostgres } from "./local-postgres.mjs";

const run = promisify(exec);
const root = process.cwd();
const log = (msg) => console.log(`\x1b[36m[dev:local]\x1b[0m ${msg}`);

function portBusy(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    s.once("connect", () => (s.destroy(), resolve(true)));
    s.once("error", () => resolve(false));
  });
}

// 1. .env
const envPath = path.join(root, ".env");
if (!existsSync(envPath)) {
  const example = readFileSync(path.join(root, ".env.example"), "utf8");
  writeFileSync(
    envPath,
    example.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${randomBytes(32).toString("hex")}"`),
  );
  log("создан файл .env со случайным SESSION_SECRET");
}

// 2. база
const env = { ...process.env, DATABASE_URL: LOCAL_PG_URL };
let pg = null;
if (await portBusy(LOCAL_PG_PORT)) {
  log(`порт ${LOCAL_PG_PORT} уже занят: считаю, что там запущен PostgreSQL (npm run db:local)`);
} else {
  log("запускаю локальный PostgreSQL (PGlite), данные в папке .pglite");
  pg = await startLocalPostgres();
}

// 3. миграции и сид (асинхронно: сервер PGlite живёт в этом же процессе)
log("применяю миграции…");
await run("npx prisma migrate deploy", { cwd: root, env });
let needSeed = true;
if (pg) {
  const { rows } = await pg.db.query('SELECT count(*)::int AS n FROM "Exercise"');
  needSeed = rows[0].n === 0;
}
if (needSeed) {
  log("загружаю стартовые упражнения…");
  await run("npm run db:seed", { cwd: root, env });
}

// 4. Next.js
log("запускаю http://localhost:3000 (Ctrl+C — остановить)");
const next = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [next, "dev"], { cwd: root, env, stdio: "inherit" });

let stopping = false;
const stop = async (code = 0) => {
  if (stopping) return;
  stopping = true;
  child.kill();
  if (pg) await pg.stop().catch(() => {});
  process.exit(code);
};
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
child.on("exit", (code) => stop(code ?? 0));
