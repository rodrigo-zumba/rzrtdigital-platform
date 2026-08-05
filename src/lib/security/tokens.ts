import { createHash, randomBytes } from "node:crypto";

/**
 * Tokens de convite e de reset (CLAUDE.md §4.6): aleatório de 32 bytes,
 * armazenado só como hash SHA-256, uso único, expiração (convite 7d, reset 1h).
 */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const INVITATION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_EXPIRATION_MS = 60 * 60 * 1000;
