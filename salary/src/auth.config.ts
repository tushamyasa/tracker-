import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Конфиг без обращений к БД и нативным модулям — им пользуется proxy.ts.
 * Провайдеры добавляются в auth.ts.
 */
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = PUBLIC_PATHS.includes(nextUrl.pathname);

      if (isPublic) {
        // авторизованного не пускаем на страницы входа/регистрации
        return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      }
      // false → Auth.js сам перенаправит на pages.signIn
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
