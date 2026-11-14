import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

/** Чистая БД для каждого прогона: удаляем e2e.db и применяем миграции. */
export default function globalSetup() {
  const root = path.resolve(__dirname, "..");
  for (const f of ["e2e.db", "e2e.db-journal", "e2e.db-wal", "e2e.db-shm"]) {
    const p = path.join(root, f);
    if (existsSync(p)) rmSync(p);
  }
  execSync("npx drizzle-kit migrate", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, TURSO_DATABASE_URL: "file:e2e.db", TURSO_AUTH_TOKEN: "" },
  });
}
