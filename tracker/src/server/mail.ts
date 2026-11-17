import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Отправка писем. Транспорт выбирается переменной MAIL_TRANSPORT:
 *  smtp    — реальная отправка через SMTP_URL (по умолчанию, если SMTP_URL задан);
 *  file    — письма пишутся JSON-файлами в MAIL_OUTBOX_DIR (тесты и локальная отладка);
 *  console — письмо печатается в лог сервера (по умолчанию, если SMTP_URL не задан).
 */
export async function sendMail(mail: Mail, env: Record<string, string | undefined> = process.env) {
  const transport = env.MAIL_TRANSPORT ?? (env.SMTP_URL ? "smtp" : "console");
  const from = env.MAIL_FROM ?? "Workout Tracker <no-reply@localhost>";

  if (transport === "smtp") {
    if (!env.SMTP_URL) throw new Error("SMTP_URL is not set");
    const t = nodemailer.createTransport(env.SMTP_URL);
    await t.sendMail({ from, ...mail });
    return;
  }

  if (transport === "file") {
    const dir = path.resolve(env.MAIL_OUTBOX_DIR ?? path.join(process.cwd(), "outbox"));
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
    await writeFile(path.join(dir, name), JSON.stringify({ from, ...mail }, null, 2));
    return;
  }

  console.log(`[mail] to=${mail.to} subject=${mail.subject}\n${mail.text}`);
}
