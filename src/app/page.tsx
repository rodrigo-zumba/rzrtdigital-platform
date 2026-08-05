import { redirect } from "next/navigation";

import { getRequestContext } from "@/lib/auth";

// Rotas de marketing ficam no site institucional — aqui só existe a área
// autenticada (docs/ESPECIFICACAO.md §8).
export default async function RootPage() {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");

  if (ctx.kind === "INTERNAL") redirect("/admin");

  if (ctx.memberships.length > 1) redirect("/selecionar-workspace");
  if (ctx.memberships.length === 1) redirect("/portal");

  // CLIENT sem nenhuma membership ativa: estado sem acesso válido.
  redirect("/login");
}
