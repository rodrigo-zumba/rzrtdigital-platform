import { config as loadEnv } from "dotenv";

// Mesma precedência do Next.js/prisma.config.ts: .env.local sobrescreve .env.
// Precisa rodar antes de qualquer import que toque src/lib/env.ts.
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import "@testing-library/jest-dom/vitest";
