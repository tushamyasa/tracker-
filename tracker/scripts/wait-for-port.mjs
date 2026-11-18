// Ждёт, пока на локальном порту появится сервер. Используется в e2e: приложение должно стартовать
// только после того, как поднялась база.   node scripts/wait-for-port.mjs 5545 [секунд]
import net from "node:net";

const port = Number(process.argv[2]);
const timeoutMs = Number(process.argv[3] ?? 120) * 1000;
if (!port) {
  console.error("Укажите порт: node scripts/wait-for-port.mjs 5545");
  process.exit(2);
}

const deadline = Date.now() + timeoutMs;
const probe = () =>
  new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    s.once("connect", () => {
      s.destroy();
      resolve(true);
    });
    s.once("error", () => resolve(false));
  });

while (!(await probe())) {
  if (Date.now() > deadline) {
    console.error(`Порт ${port} не открылся за ${timeoutMs / 1000} с`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 300));
}
