"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * Применяет тему из профиля пользователя: при первой загрузке и когда она изменилась на сервере.
 * Повторно с тем же значением не применяет: иначе обновление контекста next-themes (оно меняет
 * идентичность setTheme) на мгновение возвращало бы тему из профиля поверх только что выбранной.
 */
export function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (applied.current === theme) return;
    applied.current = theme;
    setTheme(theme);
  }, [theme, setTheme]);
  return null;
}
