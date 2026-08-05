#!/usr/bin/env node
// postinstall roda em todo `pnpm install`, inclusive antes do schema existir
// (bootstrap). Evita falhar a instalação quando prisma/schema.prisma ainda
// não foi criado.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const schemaPath = fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url));

if (existsSync(schemaPath)) {
  execSync("prisma generate", { stdio: "inherit" });
} else {
  console.log("i prisma/schema.prisma ainda não existe — pulando `prisma generate`.");
}
