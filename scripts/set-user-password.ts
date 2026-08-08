/**
 * Define ou altera a senha de um usuário existente sem expor o valor no terminal.
 *
 * Uso:
 *   pnpm tsx scripts/set-user-password.ts usuario@exemplo.com
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { hashPassword } from "../src/lib/auth/password";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não está configurada.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function askHiddenPassword(question: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Execute este script em um terminal interativo.");
  }

  return new Promise((resolve, reject) => {
    stdout.write(question);
    let password = "";

    const finish = () => {
      stdin.setRawMode(false);
      stdin.removeListener("data", onData);
      stdin.pause();
      stdout.write("\n");
    };

    const onData = (buffer: Buffer) => {
      const char = buffer.toString("utf8");

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          finish();
          resolve(password);
          break;
        case "\u0003":
          finish();
          reject(new Error("Operação cancelada."));
          break;
        case "\u007f":
          password = password.slice(0, -1);
          break;
        default:
          password += char;
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
  if (!/[A-Z]/.test(password)) return "Inclua ao menos uma letra maiúscula.";
  if (!/[a-z]/.test(password)) return "Inclua ao menos uma letra minúscula.";
  if (!/[0-9]/.test(password)) return "Inclua ao menos um número.";
  return null;
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  let email = (process.argv[2] ?? "").trim().toLowerCase();

  if (!email) {
    email = (await rl.question("E-mail do usuário: ")).trim().toLowerCase();
  }

  if (!EMAIL_REGEX.test(email)) {
    rl.close();
    throw new Error("E-mail inválido.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    rl.close();
    throw new Error(`Usuário não encontrado: ${email}`);
  }

  let password = "";

  for (;;) {
    password = await askHiddenPassword(
      "Nova senha (mín. 12 caracteres, maiúscula/minúscula/número): ",
    );

    const validationError = validatePassword(password);
    if (validationError) {
      console.log(validationError);
      continue;
    }

    const confirmation = await askHiddenPassword("Confirme a nova senha: ");
    if (confirmation !== password) {
      console.log("As senhas não coincidem. Tente novamente.\n");
      continue;
    }

    break;
  }

  rl.close();

  const passwordHash = await hashPassword(password);
  const changedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: changedAt,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "user.password_set_by_admin_script",
        entityType: "User",
        entityId: user.id,
        metadata: { via: "scripts/set-user-password.ts" },
      },
    });
  });

  console.log(`✓ Senha atualizada com segurança para ${email}.`);
}

main()
  .catch((error) => {
    console.error(`✖ ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
