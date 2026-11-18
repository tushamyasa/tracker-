import { auth } from "@/auth";
import { getCategoryOptions } from "@/actions/transactions";
import { PrivacyProvider } from "@/components/dashboard/privacy";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddProvider } from "@/components/layout/quick-add";
import { TzSync } from "@/components/layout/tz-sync";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, categories] = await Promise.all([auth(), getCategoryOptions()]);
  return (
    <PrivacyProvider>
      <QuickAddProvider categories={categories}>
        <TzSync />
        <div className="min-h-screen">
          <Sidebar />
          <div className="md:pl-60">
            <Header name={session?.user?.name} email={session?.user?.email} />
            <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-6 md:pb-6">{children}</main>
          </div>
          <BottomNav />
        </div>
      </QuickAddProvider>
    </PrivacyProvider>
  );
}
