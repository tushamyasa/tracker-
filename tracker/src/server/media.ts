import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { sniffImage } from "@/lib/image-sniff";

/** Папка загрузок; в production задайте UPLOAD_DIR на постоянный диск. */
export const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const MEDIA_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

/** Сохраняет загруженную картинку и возвращает URL для отображения. */
export async function saveImage(file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("bad_image_type");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("image_too_big");
  const bytes = Buffer.from(await file.arrayBuffer());
  // Содержимое должно соответствовать заявленному типу, а не только MIME из запроса.
  if (sniffImage(bytes) !== ext) throw new Error("bad_image_type");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return `/api/media/${name}`;
}

export async function deleteImage(url: string | null | undefined) {
  const name = url?.startsWith("/api/media/") ? url.slice("/api/media/".length) : null;
  if (!name || !MEDIA_NAME.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

export async function readImage(name: string): Promise<Buffer | null> {
  if (!MEDIA_NAME.test(name)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}
