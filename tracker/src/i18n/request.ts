import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export default getRequestConfig(async () => {
  const store = await cookies();
  const value = store.get("locale")?.value;
  const locale: Locale = locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
