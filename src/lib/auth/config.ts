import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/lib/env";
import { getClientIp } from "@/lib/security/rate-limit";
import { attemptLogin } from "@/modules/auth/services/login.service";

/**
 * Credentials exige estratégia JWT (docs/ESPECIFICACAO.md §6). O JWT carrega
 * SOMENTE o id do usuário (`sub`) — nenhuma role, nenhum organizationId.
 * Tudo mais é resolvido do banco a cada request por getRequestContext().
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        const ip = getClientIp(request.headers);

        const user = await attemptLogin({ email, password, ip });
        if (!user) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      // Necessário para invalidar sessões emitidas antes de uma troca de
      // senha (ver src/lib/auth/request-context.ts) — não há sessão em
      // banco para revogar com estratégia JWT.
      if (token.iat) {
        session.issuedAt = token.iat * 1000;
      }
      return session;
    },
  },
});
