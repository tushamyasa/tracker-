import { describe, expect, it, beforeEach } from "vitest";
import { sniffImage } from "@/lib/image-sniff";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("пропускает до лимита и блокирует сверх него", () => {
    const t = 1_000;
    const results = Array.from({ length: 4 }, () => rateLimit("a", 3, 60_000, t));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results[3].remaining).toBe(0);
  });
  it("лимит считается отдельно по ключам", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000, 1_000);
    expect(rateLimit("a", 3, 60_000, 1_000).ok).toBe(false);
    expect(rateLimit("b", 3, 60_000, 1_000).ok).toBe(true);
  });
  it("после окончания окна счётчик сбрасывается", () => {
    for (let i = 0; i < 5; i++) rateLimit("a", 3, 60_000, 1_000);
    expect(rateLimit("a", 3, 60_000, 61_001).ok).toBe(true);
  });
  it("сообщает, через сколько секунд повторить", () => {
    rateLimit("a", 1, 60_000, 0);
    expect(rateLimit("a", 1, 60_000, 10_000).retryAfterSec).toBe(50);
  });
});

describe("sniffImage", () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
  const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");

  it("узнаёт PNG, JPEG и WebP по сигнатуре", () => {
    expect(sniffImage(png)).toBe("png");
    expect(sniffImage(jpg)).toBe("jpg");
    expect(sniffImage(webp)).toBe("webp");
  });
  it("отвергает остальное: текст, HTML, SVG, обрезанные файлы", () => {
    expect(sniffImage(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(
      sniffImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")),
    ).toBeNull();
    expect(sniffImage(Uint8Array.from([0x89, 0x50]))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
    expect(sniffImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBeNull();
  });
});
