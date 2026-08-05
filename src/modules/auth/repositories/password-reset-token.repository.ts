import { db } from "@/lib/db";

export function createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  return db.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
}

/** findUnique por tokenHash — o caller valida expiração/uso depois do lookup. */
export function findByTokenHash(tokenHash: string) {
  return db.passwordResetToken.findUnique({ where: { tokenHash } });
}

export function markUsed(id: string) {
  return db.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
}
