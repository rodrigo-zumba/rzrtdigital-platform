import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";

/**
 * Proxy (docs/ESPECIFICACAO.md §8 chama de "middleware"; Next.js 16 renomeou
 * o arquivo para proxy.ts, mesma função, agora em runtime Node.js por
 * padrão). Só valida presença de sessão e redireciona — autorização real
 * fica no layout/server.
 */
export default auth((request) => {
  const isAuthenticated = !!request.auth?.user;

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Fechado por padrão: cobre tudo menos (auth), _next e assets — o domínio é
  // dedicado ao painel, então o padrão é "fechado" (CLAUDE.md/ESPECIFICACAO §8).
  matcher: ["/((?!login|esqueci-minha-senha|redefinir-senha|convite|api/auth|_next|.*\\..*).*)"],
};
