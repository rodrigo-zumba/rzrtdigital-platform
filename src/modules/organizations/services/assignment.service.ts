import type { AssignmentType } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  createAssignment as createAssignmentRow,
  listAssignableInternalUsers,
  listAssignments as listAssignmentsRows,
  removeAssignment as removeAssignmentRow,
} from "@/modules/organizations/repositories/assignment.repository";
import { findById } from "@/modules/organizations/repositories/organization.repository";

/**
 * `assignments.manage` é exclusivo de SUPER_ADMIN/ADMIN (docs/ESPECIFICACAO.md
 * §4) — MANAGER/ANALYST não escolhem a própria carteira.
 */
export async function listAssignments(ctx: RequestContext, organizationId: string) {
  requirePermission(ctx, "assignments.manage");
  const [assignments, assignableUsers] = await Promise.all([
    listAssignmentsRows(organizationId),
    listAssignableInternalUsers(),
  ]);
  return { assignments, assignableUsers };
}

export async function createAssignment(
  ctx: RequestContext,
  organizationId: string,
  userId: string,
  assignmentType: AssignmentType,
) {
  requirePermission(ctx, "assignments.manage");

  const organization = await findById(organizationId);
  if (!organization || organization.deletedAt) throw new NotFoundError("Cliente não encontrado.");

  try {
    const assignment = await createAssignmentRow(organizationId, userId, assignmentType);

    await createAuditLog({
      actorUserId: ctx.userId,
      organizationId,
      action: "assignment.create",
      entityType: "OrganizationAssignment",
      entityId: assignment.id,
      metadata: { userId, assignmentType },
    });

    return assignment;
  } catch {
    throw new ValidationError("Este usuário já está atribuído a este cliente com este tipo de carteira.");
  }
}

export async function removeAssignment(ctx: RequestContext, organizationId: string, assignmentId: string) {
  requirePermission(ctx, "assignments.manage");

  await removeAssignmentRow(organizationId, assignmentId);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "assignment.remove",
    entityType: "OrganizationAssignment",
    entityId: assignmentId,
    metadata: {},
  });
}
