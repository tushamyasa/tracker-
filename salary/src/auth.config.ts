import type { NextAuthConfig } from "next-auth";

// Edge-safe часть конфигурации (без БД и bcrypt) — используется в proxy.ts
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const loggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isAuthPage = path === "/login" || path === "/register";
      if (isAuthPage) {
        return loggedIn ? Response.redirect(new URL("/dashboard", request.nextUrl)) : true;
      }
      const isPrivate = ["/dashboard", "/transactions", "/categories", "/analytics", "/settings"].some(
        (p) => path === p || path.startsWith(p + "/"),
      );
      return isPrivate ? loggedIn : true;
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
