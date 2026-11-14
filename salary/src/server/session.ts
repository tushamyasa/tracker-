import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Единая точка получения id пользователя для запросов к данным.
 * Вызывать в начале каждой Server Action / запроса (внутри <Suspense>).
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return id;
}
