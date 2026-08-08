import type { InternalRole, MemberRole } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  assertOrganizationAccess,
  canGrantInternalRole,
  canGrantMemberRole,
  canManageUser,
  requirePermission,
} from "@/lib/permissions";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  countActiveSuperAdmins,
  countInternalUsers,
  findMembership,
  findSafeUserById,
  listInternalUsers as listInternalUsersRows,
  listOrganizationMembers as listOrganizationMembersRows,
  removeMember as removeMemberRow,
  setMemberStatus as setMemberStatusRow,
  setUserStatus as setUserStatusRow,
  updateInternalRole as updateInternalRoleRow,
  updateMemberRole as updateMemberRoleRow,
  updateOwnName,
  type InternalUserFilters,
} from "@/modules/users/repositories/user.repository";

const PAGE_SIZE = 20;

export async function listInternalUsers(
  ctx: RequestContext,
  params: { q?: string; role?: InternalRole; page: number },
) {
  requirePermission(ctx, "users.read");

  const filters: InternalUserFilters = { q: params.q, role: params.role };
  const [items, total] = await Promise.all([
    listInternalUsersRows(filters, { skip: (params.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countInternalUsers(filters),
  ]);

  return { items, total, page: params.page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function updateInternalUserRole(ctx: RequestContext, userId: string, role: InternalRole) {
  requirePermission(ctx, "users.update");
  if (userId === ctx.userId) throw new ForbiddenError("Você não pode alterar seu próprio papel.");
  if (!canGrantInternalRole(ctx, role)) throw new ForbiddenError();
  if (!(await canManageUser(ctx, userId))) throw new ForbiddenError();

  const target = await findSafeUserById(userId);
  if (!target || target.type !== "INTERNAL") throw new NotFoundError("Usuário não encontrado.");

  if (target.internalProfile?.internalRole === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    if ((await countActiveSuperAdmins()) <= 1) {
      throw new ValidationError("Precisa haver ao menos um SUPER_ADMIN ativo.");
    }
  }

  const updated = await updateInternalRoleRow(userId, role);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId: null,
    action: "user.role_change",
    entityType: "User",
    entityId: userId,
    metadata: { from: target.internalProfile?.internalRole, to: role },
  });

  return updated;
}

export async function setInternalUserStatus(ctx: RequestContext, userId: string, status: "ACTIVE" | "SUSPENDED") {
  requirePermission(ctx, "users.suspend");
  if (userId === ctx.userId) throw new ForbiddenError("Você não pode suspender a si mesmo.");
  if (!(await canManageUser(ctx, userId))) throw new ForbiddenError();

  const target = await findSafeUserById(userId);
  if (!target || target.type !== "INTERNAL") throw new NotFoundError("Usuário não encontrado.");

  if (status === "SUSPENDED" && target.internalProfile?.internalRole === "SUPER_ADMIN") {
    if ((await countActiveSuperAdmins()) <= 1) {
      throw new ValidationError("Precisa haver ao menos um SUPER_ADMIN ativo.");
    }
  }

  const updated = await setUserStatusRow(userId, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId: null,
    action: status === "SUSPENDED" ? "user.suspend" : "user.reactivate",
    entityType: "User",
    entityId: userId,
    metadata: {},
  });

  return updated;
}

export async function listOrganizationMembers(ctx: RequestContext, organizationId: string) {
  requirePermission(ctx, "users.read", organizationId);
  assertOrganizationAccess(ctx, organizationId);
  return listOrganizationMembersRows(organizationId);
}

export async function updateMemberRole(
  ctx: RequestContext,
  organizationId: string,
  userId: string,
  role: MemberRole,
) {
  requirePermission(ctx, "users.update", organizationId);
  assertOrganizationAccess(ctx, organizationId);
  if (userId === ctx.userId) throw new ForbiddenError("Você não pode alterar seu próprio papel.");
  if (!canGrantMemberRole(ctx, role, organizationId)) throw new ForbiddenError();
  if (!(await canManageUser(ctx, userId))) throw new ForbiddenError();

  const membership = await findMembership(organizationId, userId);
  if (!membership) throw new NotFoundError("Membro não encontrado nesta organização.");

  const updated = await updateMemberRoleRow(organizationId, membership.id, role);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "member.role_change",
    entityType: "OrganizationMember",
    entityId: membership.id,
    metadata: { from: membership.role, to: role },
  });

  return updated;
}

export async function setMemberStatus(
  ctx: RequestContext,
  organizationId: string,
  userId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  requirePermission(ctx, "users.suspend", organizationId);
  assertOrganizationAccess(ctx, organizationId);
  if (userId === ctx.userId) throw new ForbiddenError("Você não pode suspender a si mesmo.");
  if (!(await canManageUser(ctx, userId))) throw new ForbiddenError();

  const membership = await findMembership(organizationId, userId);
  if (!membership) throw new NotFoundError("Membro não encontrado nesta organização.");

  const updated = await setMemberStatusRow(organizationId, membership.id, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: status === "SUSPENDED" ? "member.suspend" : "member.reactivate",
    entityType: "OrganizationMember",
    entityId: membership.id,
    metadata: {},
  });

  return updated;
}

export async function removeMember(ctx: RequestContext, organizationId: string, userId: string) {
  requirePermission(ctx, "users.remove", organizationId);
  assertOrganizationAccess(ctx, organizationId);
  if (userId === ctx.userId) throw new ForbiddenError("Você não pode remover a si mesmo.");
  if (!(await canManageUser(ctx, userId))) throw new ForbiddenError();

  const membership = await findMembership(organizationId, userId);
  if (!membership) throw new NotFoundError("Membro não encontrado nesta organização.");

  await removeMemberRow(organizationId, membership.id);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "member.remove",
    entityType: "OrganizationMember",
    entityId: membership.id,
    metadata: { removedUserId: userId },
  });
}

/** Qualquer usuário autenticado edita o próprio nome — não exige permissão além de estar logado. */
export async function updateOwnProfile(ctx: RequestContext, name: string) {
  const updated = await updateOwnName(ctx.userId, name);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId: null,
    action: "user.profile_update",
    entityType: "User",
    entityId: ctx.userId,
    metadata: {},
  });

  return updated;
}
