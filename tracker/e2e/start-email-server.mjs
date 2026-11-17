// Второй экземпляр приложения для e2e входа по ссылке из письма (AUTH_MODE=email, порт 3001).
// Использует ту же production-сборку, что и основной сервер на порту 3000, поэтому ждёт его готовности:
// основной сервер сам выполняет `npm run build`.
import { spawn } from "node:child_process";
import path from "node:path";

const MAIN = "http://localhost:3000/api/health";
const deadline = Date.now() + 5 * 60_000;

async function mainReady() {
  try {
    const res = await fetch(MAIN);
    return res.ok;
  } catch {
    return false;
  }
}

while (!(await mainReady())) {
  if (Date.now() > deadline) {
    console.error("Основной сервер не поднялся за 5 минут");
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const next = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [next, "start", "-p", "3001"], {
  stdio: "inherit",
  env: {
    ...process.env,
    AUTH_MODE: "email",
    APP_URL: "http://localhost:3001",
    MAIL_TRANSPORT: "file",
    // Все тесты идут с одного адреса; лимит на почтовый адрес (5) оставляем по умолчанию, он проверяется тестом.
    AUTH_LINK_IP_LIMIT: "1000",
    MAIL_OUTBOX_DIR: path.join(process.cwd(), ".e2e-outbox"),
    SESSION_SECRET: "e2e-only-secret-0123456789-abcdefghijklmnop",
  },
});

const stop = () => child.kill();
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
process.on("exit", stop);
child.on("exit", (code) => process.exit(code ?? 0));
