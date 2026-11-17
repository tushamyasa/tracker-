import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { simpleParser } from "mailparser";
import { SMTPServer } from "smtp-server";
import { afterAll, describe, expect, it, vi } from "vitest";
import { sendMail } from "@/server/mail";

const dirs: string[] = [];
afterAll(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
});

const mail = {
  to: "user@example.com",
  subject: "Тема письма",
  text: "Ссылка: https://t.example.com/auth/verify?token=" + "x".repeat(80),
};

describe("sendMail: file", () => {
  it("пишет письмо JSON-файлом в папку", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "mail-"));
    dirs.push(dir);
    await sendMail(mail, { MAIL_TRANSPORT: "file", MAIL_OUTBOX_DIR: dir, MAIL_FROM: "A <a@x.io>" });
    const files = await readdir(dir);
    expect(files).toHaveLength(1);
    const saved = JSON.parse(await readFile(path.join(dir, files[0]), "utf8"));
    expect(saved).toMatchObject({ from: "A <a@x.io>", to: mail.to, subject: mail.subject });
    expect(saved.text).toBe(mail.text);
  });
});

describe("sendMail: console", () => {
  it("без SMTP_URL печатает письмо в лог", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendMail(mail, {});
    expect(log).toHaveBeenCalledWith(expect.stringContaining(mail.to));
    log.mockRestore();
  });
});

describe("sendMail: SMTP", () => {
  it("доставляет письмо на настоящий SMTP-сервер, длинная ссылка и кириллица не портятся", async () => {
    const received: string[] = [];
    const server = new SMTPServer({
      authOptional: true,
      disabledCommands: ["STARTTLS"],
      onData(stream, _session, callback) {
        const chunks: Buffer[] = [];
        stream.on("data", (c: Buffer) => chunks.push(c));
        stream.on("end", () => {
          received.push(Buffer.concat(chunks).toString("utf8"));
          callback();
        });
      },
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.server.address() as AddressInfo;
    try {
      await sendMail(mail, {
        MAIL_TRANSPORT: "smtp",
        SMTP_URL: `smtp://127.0.0.1:${port}`,
        MAIL_FROM: "Tracker <no-reply@example.com>",
      });
      expect(received).toHaveLength(1);
      const parsed = await simpleParser(received[0]);
      expect(parsed.subject).toBe(mail.subject);
      expect(parsed.to).toMatchObject({ text: "user@example.com" });
      expect(parsed.from?.text).toContain("no-reply@example.com");
      expect(parsed.text?.trim()).toBe(mail.text);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("SMTP без SMTP_URL — понятная ошибка", async () => {
    await expect(sendMail(mail, { MAIL_TRANSPORT: "smtp" })).rejects.toThrow("SMTP_URL");
  });
});
