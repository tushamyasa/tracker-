import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { BottomNav, Sidebar } from "@/components/Nav";
import { ThemeSync } from "@/components/ThemeSync";
import { ToastProvider } from "@/components/ui/Toast";
import { requireUser } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  const t = await getTranslations("common");
  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-accent focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("skipToContent")}
      </a>
      <ThemeSync theme={user.theme} />
      <Sidebar />
      <div className="lg:pl-60">
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1120px] px-4 pb-28 pt-6 lg:px-8 lg:pb-12"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </ToastProvider>
  );
}
