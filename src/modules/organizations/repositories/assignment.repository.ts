import type { AssignmentType } from "@prisma/client";

import { db } from "@/lib/db";

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  internalProfile: { select: { internalRole: true } },
} as const;

export function listAssignments(organizationId: string) {
  return db.organizationAssignment.findMany({
    where: { organizationId },
    include: { user: { select: SAFE_USER_SELECT } },
    orderBy: { createdAt: "asc" },
  });
}

export function createAssignment(organizationId: string, userId: string, assignmentType: AssignmentType) {
  return db.organizationAssignment.create({ data: { organizationId, userId, assignmentType } });
}

/** `id` + `organizationId` no where — ver nota em user.repository.ts sobre o tenant guard. */
export function removeAssignment(organizationId: string, assignmentId: string) {
  return db.organizationAssignment.delete({ where: { id: assignmentId, organizationId } });
}

/** Carteira disponível para atribuir: apenas MANAGER e ANALYST (docs/ESPECIFICACAO.md §4). */
export function listAssignableInternalUsers() {
  return db.user.findMany({
    where: { type: "INTERNAL", status: "ACTIVE", internalProfile: { internalRole: { in: ["MANAGER", "ANALYST"] } } },
    select: SAFE_USER_SELECT,
    orderBy: { name: "asc" },
  });
}
