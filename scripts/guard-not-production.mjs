#!/usr/bin/env node
/**
 * Guard runtime: aborta `migrate dev`, `migrate reset` e `seed` se
 * NODE_ENV=production (CLAUDE.md §4.11). Chamado como prefixo dos scripts
 * npm correspondentes e, no caso do seed, também de dentro do próprio
 * prisma/seed.ts (defesa em profundidade).
 */
const command = process.argv[2] ?? "este comando";

if (process.env.NODE_ENV === "production") {
  console.error(`✖ Abortado: "${command}" não pode rodar com NODE_ENV=production.`);
  process.exit(1);
}

process.exit(0);
