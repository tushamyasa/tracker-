import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { MIME_BY_EXT, readImage } from "@/server/media";

/**
 * Отдаёт загруженное фото. Расширение .png/.jpg в адресе исключает путь из middleware
 * (его правило пропускает статические картинки), поэтому доступ проверяем здесь:
 * нужен вход, и файл должен принадлежать упражнению текущего пользователя.
 */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { name } = await params;
  const owned = await db.exercise.findFirst({
    where: { mediaUrl: `/api/media/${name}`, ownerId: user.id },
    select: { id: true },
  });
  if (!owned) return new Response("Not found", { status: 404 });

  const data = await readImage(name);
  if (!data) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop() ?? "";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
