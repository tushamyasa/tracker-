import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** Папка «почтового ящика»: сервер на :3001 пишет сюда письма вместо отправки по SMTP. */
export const OUTBOX_DIR = path.join(process.cwd(), ".e2e-outbox");

export interface SavedMail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Ждёт письмо для адреса и возвращает последнее из пришедших. */
export async function waitForMail(to: string, timeoutMs = 10_000): Promise<SavedMail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const files = await readdir(OUTBOX_DIR).catch(() => [] as string[]);
    const mails: { name: string; mail: SavedMail }[] = [];
    for (const name of files.filter((f) => f.endsWith(".json")).sort()) {
      const mail = JSON.parse(await readFile(path.join(OUTBOX_DIR, name), "utf8")) as SavedMail;
      if (mail.to === to) mails.push({ name, mail });
    }
    if (mails.length > 0) return mails[mails.length - 1].mail;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Письмо для ${to} не пришло за ${timeoutMs} мс`);
}

export async function countMails(to: string): Promise<number> {
  const files = await readdir(OUTBOX_DIR).catch(() => [] as string[]);
  let n = 0;
  for (const name of files.filter((f) => f.endsWith(".json"))) {
    const mail = JSON.parse(await readFile(path.join(OUTBOX_DIR, name), "utf8")) as SavedMail;
    if (mail.to === to) n++;
  }
  return n;
}

export function linkFrom(mail: SavedMail): string {
  const m = mail.text.match(/https?:\/\/\S+/);
  if (!m) throw new Error("В письме нет ссылки");
  return m[0];
}

export const uniqueEmail = () => `mail${Date.now()}${Math.floor(Math.random() * 100000)}@fake.test`;
