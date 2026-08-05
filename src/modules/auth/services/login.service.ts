import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, loginRateLimitByEmail, loginRateLimitByIp } from "@/lib/security/rate-limit";
import {
  findByEmailForLogin,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
} from "@/modules/users/repositories/user.repository";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type AuthenticatedUser = { id: string; name: string; email: string };

const FAILED_ATTEMPTS_LOCKOUT_STEP = 5;
const LOCKOUT_MINUTES_PER_STEP = 15;
const LOCKOUT_MAX_MINUTES = 4 * 60;

function computeLockedUntil(failedAttemptsAfterThisFailure: number): Date | null {
  if (failedAttemptsAfterThisFailure % FAILED_ATTEMPTS_LOCKOUT_STEP !== 0) return null;

  const steps = failedAttemptsAfterThisFailure / FAILED_ATTEMPTS_LOCKOUT_STEP;
  const minutes = Math.min(LOCKOUT_MINUTES_PER_STEP * steps, LOCKOUT_MAX_MINUTES);
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Mensagens de erro de auth são genéricas, sem enumeração de usuário
 * (CLAUDE.md §4.7) — por isso este service só retorna o usuário ou `null`,
 * nunca o motivo específico da falha.
 */
export async function attemptLogin(params: {
  email: string;
  password: string;
  ip: string;
}): Promise<AuthenticatedUser | null> {
  const parsed = credentialsSchema.safeParse({ email: params.email, password: params.password });
  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  const [ipAllowed, emailAllowed] = await Promise.all([
    checkRateLimit(loginRateLimitByIp, params.ip),
    checkRateLimit(loginRateLimitByEmail, email),
  ]);
  if (!ipAllowed || !emailAllowed) return null;

  const user = await findByEmailForLogin(email);
  if (!user || !user.passwordHash || user.status !== "ACTIVE") return null;

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) return null;

  const validPassword = await verifyPassword(user.passwordHash, password);
  if (!validPassword) {
    const failedAttempts = user.failedLoginAttempts + 1;
    await incrementFailedLoginAttempts(user.id, computeLockedUntil(failedAttempts));
    return null;
  }

  await resetFailedLoginAttempts(user.id);

  return { id: user.id, name: user.name, email: user.email };
}
