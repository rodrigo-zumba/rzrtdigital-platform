import { hashPassword } from "@/lib/auth/password";
import { env } from "@/lib/env";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { ValidationError } from "@/lib/errors";
import {
  checkRateLimit,
  forgotPasswordRateLimitByEmail,
  forgotPasswordRateLimitByIp,
} from "@/lib/security/rate-limit";
import { generateToken, hashToken, PASSWORD_RESET_EXPIRATION_MS } from "@/lib/security/tokens";
import {
  createPasswordResetToken,
  findByTokenHash,
  markUsed,
} from "@/modules/auth/repositories/password-reset-token.repository";
import { findByEmail, setPasswordHash } from "@/modules/users/repositories/user.repository";

/**
 * Nunca revela se o e-mail existe (CLAUDE.md §4.7) — o caller sempre mostra
 * "Se o e-mail existir, enviaremos as instruções", independente do que esta
 * função faz internamente.
 */
export async function requestPasswordReset(params: { email: string; ip: string }): Promise<void> {
  const email = params.email.trim().toLowerCase();

  const [ipAllowed, emailAllowed] = await Promise.all([
    checkRateLimit(forgotPasswordRateLimitByIp, params.ip),
    checkRateLimit(forgotPasswordRateLimitByEmail, email),
  ]);
  if (!ipAllowed || !emailAllowed) return;

  const user = await findByEmail(email);
  if (!user || user.status !== "ACTIVE" || !user.passwordHash) return;

  const { token, tokenHash } = generateToken();
  await createPasswordResetToken(user.id, tokenHash, new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MS));

  await sendEmail({
    to: user.email,
    ...passwordResetEmail({ resetUrl: `${env.APP_URL}/redefinir-senha?token=${token}` }),
  });
}

export async function resetPassword(params: { token: string; password: string }): Promise<void> {
  const tokenHash = hashToken(params.token);
  const resetToken = await findByTokenHash(tokenHash);

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("Link de redefinição inválido, expirado ou já utilizado.");
  }

  await setPasswordHash(resetToken.userId, await hashPassword(params.password));
  await markUsed(resetToken.id);
}
