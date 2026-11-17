"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/** Применяет тему из профиля пользователя после входа. */
export function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  useEffect(() => setTheme(theme), [theme, setTheme]);
  return null;
}
