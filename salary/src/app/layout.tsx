import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Salary — Учёт доходов и расходов",
  description: "Минималистичный трекер личных и семейных финансов с поддержкой Turso и аналитики",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "!rounded-md !border !border-border !bg-popover/80 !text-foreground !backdrop-blur-md !shadow-lg",
                success: "!border-emerald-500/40",
                error: "!border-rose-500/40",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
