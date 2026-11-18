import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82,
]);
const png = (name = "a.png") => new File([PNG], name, { type: "image/png" });

const put = vi.fn(async () => ({}));
const del = vi.fn(async () => {});
const get = vi.fn();
vi.mock("@vercel/blob", () => ({ put, del, get }));

let dir: string;
let media: typeof import("@/server/media");

beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "media-"));
  process.env.UPLOAD_DIR = dir;
  media = await import("@/server/media");
});
afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_ACCESS;
  vi.clearAllMocks();
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("хранилище фото: локальный диск (без BLOB_READ_WRITE_TOKEN)", () => {
  it("сохраняет, читает и удаляет файл", async () => {
    const url = await media.saveImage(png());
    expect(url).toMatch(/^\/api\/media\/[a-f0-9-]{36}\.png$/);
    expect(await readdir(dir)).toHaveLength(1);
    const name = url.split("/").pop()!;
    expect((await media.readImage(name))?.length).toBe(PNG.length);
    await media.deleteImage(url);
    expect(await readdir(dir)).toHaveLength(0);
    expect(await media.readImage(name)).toBeNull();
    expect(put).not.toHaveBeenCalled();
  });

  it("отвергает чужое содержимое, неверный тип и слишком большой файл", async () => {
    await expect(
      media.saveImage(new File(["<html></html>"], "x.png", { type: "image/png" })),
    ).rejects.toThrow("bad_image_type");
    await expect(media.saveImage(new File([PNG], "x.gif", { type: "image/gif" }))).rejects.toThrow(
      "bad_image_type",
    );
    const big = new File([new Uint8Array(media.MAX_IMAGE_BYTES + 1)], "b.png", {
      type: "image/png",
    });
    await expect(media.saveImage(big)).rejects.toThrow("image_too_big");
  });

  it("не читает и не удаляет файлы по недопустимым именам (защита от выхода из папки)", async () => {
    expect(await media.readImage("../secret.txt")).toBeNull();
    expect(await media.readImage("..%2F..%2Fetc%2Fpasswd")).toBeNull();
    await expect(media.deleteImage("/api/media/../../x.png")).resolves.toBeUndefined();
  });
});

describe("хранилище фото: Vercel Blob (задан BLOB_READ_WRITE_TOKEN)", () => {
  it("загружает в Blob по предсказуемому пути, на диск не пишет", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    const url = await media.saveImage(png());
    const name = url.split("/").pop()!;
    expect(put).toHaveBeenCalledTimes(1);
    const [pathname, , options] = put.mock.calls[0] as unknown as [
      string,
      Buffer,
      { access: string; contentType: string; addRandomSuffix: boolean },
    ];
    expect(pathname).toBe(`exercises/${name}`);
    expect(options).toMatchObject({
      access: "private",
      contentType: "image/png",
      addRandomSuffix: false,
    });
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("режим доступа задаётся BLOB_ACCESS", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    process.env.BLOB_ACCESS = "public";
    await media.saveImage(png());
    expect((put.mock.calls[0] as unknown as [string, Buffer, { access: string }])[2].access).toBe(
      "public",
    );
  });

  it("читает файл из Blob потоком", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    get.mockResolvedValueOnce({
      statusCode: 200,
      stream: new Response(PNG).body,
    });
    const name = "11111111-1111-1111-1111-111111111111.png";
    const buf = await media.readImage(name);
    expect(buf?.length).toBe(PNG.length);
    expect(get).toHaveBeenCalledWith(`exercises/${name}`, { access: "private" });
  });

  it("отсутствующий в Blob файл — null, а не исключение", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    get.mockResolvedValueOnce(null);
    expect(await media.readImage("11111111-1111-1111-1111-111111111111.png")).toBeNull();
    get.mockRejectedValueOnce(new Error("network"));
    expect(await media.readImage("11111111-1111-1111-1111-111111111111.png")).toBeNull();
  });

  it("удаляет из Blob по тому же пути", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";
    const name = "22222222-2222-2222-2222-222222222222.jpg";
    await media.deleteImage(`/api/media/${name}`);
    expect(del).toHaveBeenCalledWith(`exercises/${name}`);
  });
});
