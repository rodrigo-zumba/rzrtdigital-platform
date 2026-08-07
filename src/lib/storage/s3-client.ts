import { S3Client } from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

/**
 * Cliente único para o bucket S3-compatível (Cloudflare R2 — CLAUDE.md §2).
 * Só gera presigned URLs aqui; upload em si vai direto do browser pro
 * bucket, nunca passando pelo route handler (CLAUDE.md §2, coluna
 * "não usar").
 */
export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});
