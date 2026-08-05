import { z } from "zod";

/**
 * Única fonte de verdade para env vars (docs/ESPECIFICACAO.md §15.5). Falha
 * no boot se algo estiver faltando ou for inválido — nunca em runtime, no
 * meio de uma request.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Banco (Prisma / Postgres)
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),

    // Auth.js
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET precisa ter no mínimo 32 caracteres."),
    AUTH_URL: z.string().url(),

    // E-mail (Resend)
    EMAIL_TRANSPORT: z.enum(["resend", "console"]).default("console"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email(),
    // Fora de produção, e-mail nunca sai para endereço real fora desta allowlist
    // (CLAUDE.md §4.12). Não existe na especificação original — necessário para
    // implementar a invariante.
    EMAIL_DEV_ALLOWLIST_DOMAINS: z
      .string()
      .default("rzrtdigital.com,demo.rzrtdigital.com"),

    // Rate limit (Upstash Redis)
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // Storage (S3-compatible / Cloudflare R2)
    S3_ENDPOINT: z.string().url(),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_PUBLIC_URL: z.string().url(),

    // App
    APP_URL: z.string().url(),

    // Observabilidade
    SENTRY_DSN: z.string().url().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.EMAIL_TRANSPORT === "resend" && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY é obrigatório quando EMAIL_TRANSPORT=resend.",
      });
    }

    if (value.NODE_ENV === "production" && value.EMAIL_TRANSPORT === "console") {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_TRANSPORT"],
        message: "EMAIL_TRANSPORT=console não é permitido em produção.",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("✖ Variáveis de ambiente inválidas ou faltando:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Configuração de ambiente inválida. Veja .env.example.");
  }

  return parsed.data;
}

export const env = loadEnv();
