import type { InternalRole, MemberRole, UserStatus } from "@prisma/client";

import { db } from "@/lib/db";

/** User não é tenant-scoped (atravessa organizações) — sem organizationId no where. */

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  type: true,
  status: true,
  avatarUrl: true,
  lastLoginAt: true,
  createdAt: true,
  internalProfile: { select: { internalRole: true, jobTitle: true } },
} as const;

export type InternalUserFilters = { q?: string; role?: InternalRole };

function internalUsersWhere(filters: InternalUserFilters) {
  return {
    type: "INTERNAL" as const,
    ...(filters.role ? { internalProfile: { internalRole: filters.role } } : {}),
    ...(filters.q
      ? { OR: [{ name: { contains: filters.q, mode: "insensitive" as const } }, { email: { contains: filters.q, mode: "insensitive" as const } }] }
      : {}),
  };
}

export function listInternalUsers(filters: InternalUserFilters, params: { skip: number; take: number }) {
  return db.user.findMany({
    where: internalUsersWhere(filters),
    select: SAFE_USER_SELECT,
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countInternalUsers(filters: InternalUserFilters) {
  return db.user.count({ where: internalUsersWhere(filters) });
}

export function findSafeUserById(userId: string) {
  return db.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
}

export function updateOwnName(userId: string, name: string) {
  return db.user.update({ where: { id: userId }, data: { name }, select: SAFE_USER_SELECT });
}

export function updateInternalRole(userId: string, role: InternalRole) {
  return db.internalUserProfile.update({ where: { userId }, data: { internalRole: role } });
}

export function setUserStatus(userId: string, status: UserStatus) {
  return db.user.update({ where: { id: userId }, data: { status } });
}

/** Guard "não suspender/rebaixar o último SUPER_ADMIN ativo" (Fase 2). */
export function countActiveSuperAdmins() {
  return db.user.count({
    where: { type: "INTERNAL", status: "ACTIVE", internalProfile: { internalRole: "SUPER_ADMIN" } },
  });
}

/**
 * OrganizationMember é tenant-scoped, mas o `where` aqui sempre recebe
 * `organizationId` explícito — nunca lista membros fora do escopo (chamador
 * já validou acesso à organização antes de chegar aqui).
 */
export function listOrganizationMembers(organizationId: string) {
  return db.organizationMember.findMany({
    where: { organizationId },
    include: { user: { select: SAFE_USER_SELECT } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Update/delete de OrganizationMember usam `id` + `organizationId` no
 * `where` (não a chave composta `userId_organizationId`) porque o tenant
 * guard (`src/lib/db/tenant-guard.ts`) exige a chave `organizationId`
 * presente no nível raiz do `where` — a chave composta escondida dentro de
 * `userId_organizationId` não satisfaz esse guard. O caller resolve o `id`
 * via `findMembership` antes de chamar estas funções.
 */
export function updateMemberRole(organizationId: string, memberId: string, role: MemberRole) {
  return db.organizationMember.update({
    where: { id: memberId, organizationId },
    data: { role },
  });
}

export function setMemberStatus(organizationId: string, memberId: string, status: "ACTIVE" | "SUSPENDED") {
  return db.organizationMember.update({
    where: { id: memberId, organizationId },
    data: { status },
  });
}

export function removeMember(organizationId: string, memberId: string) {
  return db.organizationMember.delete({ where: { id: memberId, organizationId } });
}

export function findMembership(organizationId: string, userId: string) {
  return db.organizationMember.findUnique({ where: { userId_organizationId: { userId, organizationId } } });
}

export function findByEmailForLogin(email: string) {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      type: true,
      status: true,
      failedLoginAttempts: true,
      lockedUntil: true,
    },
  });
}

export function findRoleInfoById(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      type: true,
      internalProfile: { select: { internalRole: true } },
      organizationMemberships: {
        where: { status: "ACTIVE" },
        select: { organizationId: true, role: true },
      },
    },
  });
}

export function findByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function incrementFailedLoginAttempts(userId: string, lockedUntil: Date | null) {
  return db.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: { increment: 1 },
      ...(lockedUntil ? { lockedUntil } : {}),
    },
  });
}

export function resetFailedLoginAttempts(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

/** Também marca passwordChangedAt — invalida sessões JWT emitidas antes da troca. */
export function setPasswordHash(userId: string, passwordHash: string) {
  return db.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
}
