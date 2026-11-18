import { describe, expect, it } from "vitest";
import { sniffImage } from "@/lib/image-sniff";

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
