import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { toggleFavorite } from "@/server/actions/exercises";

export async function FavoriteButton({ id, active }: { id: string; active: boolean }) {
  const t = await getTranslations("exercises");
  return (
    <form action={toggleFavorite.bind(null, id)}>
      <button
        type="submit"
        aria-pressed={active}
        aria-label={active ? t("unfavorite") : t("favorite")}
        className="grid size-11 place-items-center rounded-control hover:bg-surface-2"
      >
        <Star className={active ? "size-5 fill-gold text-gold" : "size-5 text-muted"} aria-hidden />
      </button>
    </form>
  );
}
