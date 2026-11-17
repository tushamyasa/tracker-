import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/server/auth/token";

export async function middleware(req: NextRequest) {
  const userId = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";
  // Страница подтверждения входа по ссылке открывается без сессии.
  const isPublic = isLogin || pathname === "/auth/verify";

  if (!userId && !isPublic) {
    // API отвечает 401, а не HTML-страницей входа.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (userId && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

// Иконки и манифест должны быть доступны без входа (браузер запрашивает их сам).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|pwa-icon|manifest.webmanifest|robots.txt|api/health|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
