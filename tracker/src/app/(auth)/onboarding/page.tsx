import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ActionForm";
import { ProfileFields } from "@/components/ProfileFields";
import { requireUser } from "@/server/auth/session";
import { completeOnboarding } from "@/server/actions/auth";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboarded) redirect("/");
  const t = await getTranslations("onboarding");
  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("text")}</p>
      </div>
      <ActionForm action={completeOnboarding} submitLabel={t("submit")}>
        <ProfileFields
          values={{
            name: user.name ?? "",
            goal: user.goal ?? "strength",
            experience: user.experience ?? "beginner",
            weeklyGoal: user.weeklyGoal,
            units: user.units,
            locale: user.locale,
          }}
        />
      </ActionForm>
    </>
  );
}
