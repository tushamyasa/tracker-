import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db/client";
import { verifyCredentials } from "@/server/auth/credentials";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await verifyCredentials(db, credentials?.email, credentials?.password);
        return user ? { id: user.id, email: user.email, name: user.name } : null;
      },
    }),
  ],
});
