export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-tight">
            <span className="text-primary">Sal</span>ary
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Учёт доходов и расходов</p>
        </div>
        <div className="rounded-lg border bg-card p-6">{children}</div>
      </div>
    </main>
  );
}
