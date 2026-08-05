import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

/**
 * Rate limit por IP e por e-mail em /login, /esqueci-minha-senha e
 * /convite/[token] (docs/ESPECIFICACAO.md §6). Ativo em todo ambiente,
 * inclusive dev (docs/AMBIENTES.md) — é onde se descobre configuração errada.
 */
const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });

function limiter(prefix: string, requests: number, window: `${number} ${"s" | "m" | "h"}`) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `rzrt:ratelimit:${prefix}`,
  });
}

export const loginRateLimitByIp = limiter("login:ip", 20, "10 m");
export const loginRateLimitByEmail = limiter("login:email", 5, "10 m");
export const forgotPasswordRateLimitByIp = limiter("forgot-password:ip", 10, "10 m");
export const forgotPasswordRateLimitByEmail = limiter("forgot-password:email", 3, "10 m");
export const invitationRateLimitByIp = limiter("invitation:ip", 20, "10 m");
export const invitationRateLimitByToken = limiter("invitation:token", 10, "10 m");

/**
 * Fail-open: se o Upstash estiver inacessível (fora do ar, mal configurado),
 * loga alto e deixa passar em vez de derrubar login/reset/convite por
 * inteiro. Rate limit é defesa em profundidade, não deve ser o único ponto
 * de falha do fluxo de auth. O log é justamente o "descobrir configuração
 * errada em dev" (docs/AMBIENTES.md).
 */
export async function checkRateLimit(limit: Ratelimit, identifier: string): Promise<boolean> {
  try {
    const { success } = await limit.limit(identifier);
    return success;
  } catch (error) {
    console.error("[rate-limit] Upstash inacessível — permitindo a requisição (fail-open):", error);
    return true;
  }
}

/** IP do request, considerando proxy (Vercel/Cloudflare). Nunca confiar em um único header. */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
