import { Suspense } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddProvider } from "@/components/layout/quick-add";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { UserMenu, UserMenuSkeleton } from "@/components/layout/user-menu";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuickAddProvider>
      <div className="flex flex-1">
        <Sidebar
          footer={
            <Suspense fallback={<UserMenuSkeleton />}>
              <UserMenu />
            </Suspense>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 pb-28 md:px-6 md:pb-8">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <Toaster position="top-center" />
    </QuickAddProvider>
  );
}
