import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Precedência igual à do Next.js: .env.local sobrescreve .env.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrate/Studio usam a conexão direta (sem pooler) — DATABASE_URL
    // (possivelmente pooled) é usado só em runtime, via driver adapter.
    url: env("DIRECT_URL"),
  },
});
