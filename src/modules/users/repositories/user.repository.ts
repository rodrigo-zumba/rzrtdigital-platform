import { db } from "@/lib/db";

/** User não é tenant-scoped (atravessa organizações) — sem organizationId no where. */

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
