"use client";

import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { savePreferences } from "@/server/actions/auth";

export function ThemeLangSwitch() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function setLocale(next: string) {
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    // Сохраняем в профиль, затем обновляем страницу уже с новым языком.
    void savePreferences({ locale: next }).finally(() => router.refresh());
  }

  function changeTheme(next: string) {
    setTheme(next);
    void savePreferences({ theme: next });
  }

  const box = "rounded-control border border-border bg-surface px-3 py-2 text-sm";
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 text-sm text-muted">
        {t("theme")}
        <select
          className={box}
          value={mounted ? theme : "system"}
          onChange={(e) => changeTheme(e.target.value)}
        >
          <option value="system">{t("system")}</option>
          <option value="light">{t("light")}</option>
          <option value="dark">{t("dark")}</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        {t("language")}
        <select className={box} value={locale} onChange={(e) => setLocale(e.target.value)}>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </label>
    </div>
  );
}
