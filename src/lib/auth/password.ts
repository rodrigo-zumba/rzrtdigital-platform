import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id (CLAUDE.md §2, linha Auth). Parâmetros na faixa recomendada pela
 * OWASP para Argon2id com memória moderada (ambiente serverless).
 *
 * `algorithm: 2` = Argon2id. Literal numérico em vez do enum `Algorithm` de
 * `@node-rs/argon2` porque é um `const enum` ambiente — inacessível com
 * `isolatedModules` (exigido pelo Next.js/SWC), ver
 * https://www.typescriptlang.org/tsconfig#isolatedModules.
 */
const ARGON2_OPTIONS = {
  algorithm: 2 as const,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password, ARGON2_OPTIONS);
}
