import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

// Singleton em globalThis: evita esgotar conexões com hot-reload do Next.js
// em dev (cada reload recriaria um novo PrismaClient/pool).
const globalForPrisma = globalThis as unknown as { prismaBase?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prismaBase = globalForPrisma.prismaBase ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = prismaBase;
}
