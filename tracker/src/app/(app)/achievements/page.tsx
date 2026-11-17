import { Lock } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { AchievementIcon } from "@/components/gamification/AchievementIcon";
import { Card } from "@/components/ui/Card";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { db } from "@/lib/db";
import { loadGamification, syncAchievements } from "@/lib/gamification-data";
import { requireUser } from "@/server/auth/session";
import { pageTitle } from "@/lib/page-title";

export async function generateMetadata() {
  return { title: await pageTitle("gamification.achievementsTitle") };
}

export default async function AchievementsPage() {
  const user = await requireUser();
  const t = await getTranslations("gamification");
  const format = await getFormatter();

  // Подхватываем достижения, которые могли открыться после правок истории.
  await syncAchievements(user.id, user.weeklyGoal);
  const [unlocked, g] = await Promise.all([
    db.userAchievement.findMany({ where: { userId: user.id } }),
    loadGamification(user.id, user.weeklyGoal),
  ]);
  const when = new Map(unlocked.map((a) => [a.code, a.unlockedAt]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t("achievementsTitle")}</h1>
        <p className="mt-1 text-sm text-muted" data-testid="ach-count">
          {t("unlockedCount", { done: unlocked.length, total: ACHIEVEMENTS.length })}
        </p>
      </div>

      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-heading text-lg font-bold" data-testid="level-title">
            {t("level", { level: g.level.level })}
          </span>
          <span className="text-sm text-muted">
            {g.level.xp} / {g.level.nextAt} XP
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round(g.level.progress * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted">{t("xpRules")}</p>
      </Card>

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const at = when.get(a.code);
          return (
            <li key={a.code}>
              <Card
                className="flex items-center gap-4 p-4"
                data-testid={at ? "ach-unlocked" : "ach-locked"}
                data-code={a.code}
              >
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-full ${
                    at ? "bg-gold/20 text-gold-text" : "bg-surface-2 text-muted"
                  }`}
                >
                  {at ? (
                    <AchievementIcon code={a.code} className="size-6" />
                  ) : (
                    <Lock className="size-5" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-bold">{t(`items.${a.code}.name`)}</div>
                  <div className="text-sm text-muted">{t(`items.${a.code}.desc`)}</div>
                  {at && (
                    <div className="mt-1 text-xs text-muted">
                      {format.dateTime(at, { dateStyle: "medium" })}
                    </div>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
