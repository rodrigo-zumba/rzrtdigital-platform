import { db } from "@/lib/db";

/**
 * Uma única query, com todos os dados que getRequestContext() precisa para
 * resolver status/roles/memberships/assignments a cada request
 * (CLAUDE.md §4.4). User não é tenant-scoped — sem organizationId no where.
 */
export function findContextRowByUserId(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      type: true,
      status: true,
      passwordChangedAt: true,
      internalProfile: { select: { internalRole: true } },
      organizationMemberships: {
        where: { status: "ACTIVE" },
        select: {
          organizationId: true,
          role: true,
          status: true,
          organization: { select: { name: true } },
        },
      },
      organizationAssignments: {
        select: { organizationId: true, assignmentType: true },
      },
    },
  });
}

export type ContextRow = NonNullable<Awaited<ReturnType<typeof findContextRowByUserId>>>;
