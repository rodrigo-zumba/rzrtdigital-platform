#!/usr/bin/env node
/**
 * predeploy (docs/AMBIENTES.md): roda antes de `npm run deploy` em produção.
 * Inspeciona o próprio script "deploy" do package.json e aborta se ele
 * contiver um comando destrutivo (migrate reset, seed). Em produção, o único
 * passo de release permitido é `prisma migrate deploy`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkgPath = fileURLToPath(new URL("../package.json", import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const deployScript = pkg.scripts?.deploy ?? "";

const DANGEROUS_PATTERNS = ["migrate reset", "db seed", "prisma/seed", "migrate dev"];

const foundDangerous = DANGEROUS_PATTERNS.filter((pattern) => deployScript.includes(pattern));

if (process.env.NODE_ENV === "production" && foundDangerous.length > 0) {
  console.error(
    `✖ guard-production: o script "deploy" ("${deployScript}") contém comando(s) destrutivo(s) (${foundDangerous.join(", ")}) com NODE_ENV=production. Abortado.`,
  );
  process.exit(1);
}

console.log("✓ guard-production: nenhum comando destrutivo detectado no deploy de produção.");
process.exit(0);
