import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <p className="text-5xl font-semibold text-primary">404</p>
      <h1 className="text-xl font-semibold">Страница не найдена</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Возможно, адрес набран с ошибкой или страница была удалена.
      </p>
      <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
        На главную
      </Link>
    </main>
  );
}
