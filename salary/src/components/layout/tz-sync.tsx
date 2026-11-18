"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/** Сохраняет часовой пояс браузера в cookie, чтобы сервер считал месяцы по местному времени. */
export function TzSync() {
  const router = useRouter();
  React.useEffect(() => {
    const tz = String(new Date().getTimezoneOffset());
    const current = document.cookie.match(/(?:^|; )tz=(-?\d+)/)?.[1];
    if (current !== tz) {
      document.cookie = `tz=${tz}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
  }, [router]);
  return null;
}
