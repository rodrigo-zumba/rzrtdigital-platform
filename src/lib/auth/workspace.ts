import { cookies } from "next/headers";

import type { ClientContext } from "./types";

const WORKSPACE_COOKIE = "selectedOrganizationId";

/**
 * Um CLIENT pode ter membership em mais de uma organização
 * (docs/ESPECIFICACAO.md §3). O cookie só guarda a escolha; o valor nunca é
 * usado como filtro sem validar contra as memberships do ctx — é só um
 * atalho de UX, não uma fonte de autorização.
 */
export async function getSelectedOrganizationId(ctx: ClientContext): Promise<string | null> {
  if (ctx.memberships.length === 1) {
    return ctx.memberships[0]?.organizationId ?? null;
  }

  const cookieStore = await cookies();
  const selected = cookieStore.get(WORKSPACE_COOKIE)?.value;
  if (selected && ctx.memberships.some((membership) => membership.organizationId === selected)) {
    return selected;
  }

  return null;
}

export async function setSelectedOrganizationId(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
