import { cache } from "react";

import { UnauthenticatedError } from "@/lib/errors";
import { findContextRowByUserId } from "@/modules/auth/repositories/request-context.repository";

import { auth } from "./config";
import type { RequestContext } from "./types";

/**
 * Resolve status/roles/memberships/assignments do banco a cada request
 * (CLAUDE.md §4.4), nunca do JWT. Memoizado por request com cache() do
 * React — uma query por request, não uma por chamada.
 */
export const getRequestContext = cache(async (): Promise<RequestContext | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const row = await findContextRowByUserId(userId);
  if (!row || row.status !== "ACTIVE") return null;

  if (row.passwordChangedAt && session.issuedAt && session.issuedAt < row.passwordChangedAt.getTime()) {
    return null;
  }

  if (row.type === "INTERNAL") {
    if (!row.internalProfile) return null;

    return {
      kind: "INTERNAL",
      userId: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatarUrl,
      internalRole: row.internalProfile.internalRole,
      assignments: row.organizationAssignments,
    };
  }

  return {
    kind: "CLIENT",
    userId: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    memberships: row.organizationMemberships.map((membership) => ({
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
      role: membership.role,
      status: membership.status,
    })),
  };
});

export async function requireRequestContext(): Promise<RequestContext> {
  const ctx = await getRequestContext();
  if (!ctx) throw new UnauthenticatedError();
  return ctx;
}
