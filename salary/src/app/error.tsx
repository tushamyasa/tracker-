"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Произошла непредвиденная ошибка. Попробуйте ещё раз — ваши данные не пострадали.
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground">Код ошибки: {error.digest}</p>
      ) : null}
      <Button size="lg" onClick={reset}>
        Повторить
      </Button>
    </main>
  );
}
