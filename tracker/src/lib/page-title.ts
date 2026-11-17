import { getTranslations } from "next-intl/server";

/** Заголовок страницы из словаря: "namespace.key", например "nav.exercises". */
export async function pageTitle(path: string): Promise<string> {
  const t = await getTranslations();
  return t(path);
}
