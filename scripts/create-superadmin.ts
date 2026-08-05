/**
 * Primeiro superadmin (docs/ESPECIFICACAO.md §15.4). Interativo, sem senha
 * fixa, sem usuário demo em produção. Roda em qualquer ambiente — é o único
 * jeito de criar o primeiro INTERNAL/SUPER_ADMIN antes de existir alguém que
 * possa convidar alguém.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { hashPassword } from "../src/lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

async function askHiddenPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    let password = "";

    const onData = (buffer: Buffer) => {
      const char = buffer.toString("utf8");

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004": // Ctrl+D (EOF)
          stdin.setRawMode(false);
          stdin.removeListener("data", onData);
          stdin.pause();
          stdout.write("\n");
          resolve(password);
          break;
        case "\u0003": // Ctrl+C
          stdout.write("\n");
          process.exit(130);
          break;
        case "\u007f": // backspace (DEL)
          password = password.slice(0, -1);
          break;
        default:
          password += char;
          break;
      }
    };

    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.on("data", onData);
  });
}

function validatePassword(password: string): string | null {
  if (password.length < 12) return "A senha precisa ter no mínimo 12 caracteres.";
  if (!/[A-Z]/.test(password)) return "A senha precisa ter ao menos uma letra maiúscula.";
  if (!/[a-z]/.test(password)) return "A senha precisa ter ao menos uma letra minúscula.";
  if (!/[0-9]/.test(password)) return "A senha precisa ter ao menos um número.";
  return null;
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("== Criar primeiro superadmin (RZRT Digital) ==\n");

  const name = await ask(rl, "Nome completo: ");
  if (!name) throw new Error("Nome é obrigatório.");

  let email = "";
  for (;;) {
    email = (await ask(rl, "E-mail: ")).toLowerCase();
    if (EMAIL_REGEX.test(email)) break;
    console.log("E-mail inválido, tente novamente.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    rl.close();
    throw new Error(`Já existe um usuário com o e-mail ${email}.`);
  }

  let password = "";
  for (;;) {
    password = await askHiddenPassword("Senha (mín. 12 caracteres, com maiúscula/minúscula/número): ");
    const error = validatePassword(password);
    if (error) {
      console.log(error);
      continue;
    }
    const confirmation = await askHiddenPassword("Confirme a senha: ");
    if (confirmation !== password) {
      console.log("As senhas não coincidem. Tente novamente.\n");
      continue;
    }
    break;
  }

  rl.close();

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        type: "INTERNAL",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    await tx.internalUserProfile.create({
      data: { userId: created.id, internalRole: "SUPER_ADMIN" },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: null,
        action: "user.create_superadmin",
        entityType: "User",
        entityId: created.id,
        metadata: { via: "scripts/create-superadmin.ts" },
      },
    });

    return created;
  });

  console.log(`\n✓ Superadmin criado: ${user.name} <${user.email}> (id: ${user.id})`);
}

main()
  .catch((error) => {
    console.error(`\n✖ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
