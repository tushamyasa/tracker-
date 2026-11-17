import clsx from "clsx";
import { Dumbbell } from "lucide-react";
import Image from "next/image";

/** Фото упражнения 4:3 или иконка-заглушка, если медиа нет. */
export function ExerciseThumb({
  url,
  alt,
  className,
}: {
  url: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-control bg-accent-soft text-accent-text",
        className,
      )}
    >
      {url ? (
        <Image src={url} alt={alt} fill unoptimized className="object-cover" />
      ) : (
        <Dumbbell className="size-1/3" aria-hidden />
      )}
    </div>
  );
}
