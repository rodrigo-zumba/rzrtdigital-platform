import type { DefaultSession } from "next-auth";

// O JWT carrega só o id (CLAUDE.md §4.4) — este augmentation só expõe esse
// id em `session.user.id` para o restante do app.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
    /** `token.iat * 1000` — usado para invalidar sessões emitidas antes de uma troca de senha. */
    issuedAt?: number;
  }
}
