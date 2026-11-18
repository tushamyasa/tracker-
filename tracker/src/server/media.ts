import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { sniffImage } from "@/lib/image-sniff";

/**
 * Хранилище фото упражнений с двумя драйверами:
 *  blob  — Vercel Blob; включается, если задан BLOB_READ_WRITE_TOKEN (нужен на Vercel,
 *          где файловая система временная);
 *  local — папка на диске (UPLOAD_DIR или ./uploads), для разработки и своего сервера.
 *
 * В базе хранится только адрес вида /api/media/<имя>. Сам файл отдаёт маршрут /api/media,
 * который проверяет владельца, поэтому ни при каком драйвере фото не доступно посторонним.
 */

/** Папка загрузок для драйвера local; в production задайте UPLOAD_DIR на постоянный диск. */
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

const isBlobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Режим доступа к хранилищу Blob: private (по умолчанию) или public.
 * Должен совпадать с тем, как создано хранилище в панели Vercel.
 */
const blobAccess = () => (process.env.BLOB_ACCESS === "public" ? "public" : "private");

const blobPath = (name: string) => `exercises/${name}`;

/** Сохраняет загруженную картинку и возвращает URL для отображения. */
export async function saveImage(file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("bad_image_type");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("image_too_big");
  const bytes = Buffer.from(await file.arrayBuffer());
  // Содержимое должно соответствовать заявленному типу, а не только MIME из запроса.
  if (sniffImage(bytes) !== ext) throw new Error("bad_image_type");

  const name = `${randomUUID()}.${ext}`;
  if (isBlobEnabled()) {
    const { put } = await import("@vercel/blob");
    await put(blobPath(name), bytes, {
      access: blobAccess(),
      contentType: MIME_BY_EXT[ext],
      addRandomSuffix: false,
    });
  } else {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
  }
  return `/api/media/${name}`;
}

export async function deleteImage(url: string | null | undefined) {
  const name = url?.startsWith("/api/media/") ? url.slice("/api/media/".length) : null;
  if (!name || !MEDIA_NAME.test(name)) return;
  if (isBlobEnabled()) {
    const { del } = await import("@vercel/blob");
    await del(blobPath(name)).catch(() => {});
  } else {
    await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
  }
}

export async function readImage(name: string): Promise<Buffer | null> {
  if (!MEDIA_NAME.test(name)) return null;
  try {
    if (isBlobEnabled()) {
      const { get } = await import("@vercel/blob");
      const res = await get(blobPath(name), { access: blobAccess() });
      if (!res || res.statusCode !== 200) return null;
      return Buffer.from(await new Response(res.stream).arrayBuffer());
    }
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}
