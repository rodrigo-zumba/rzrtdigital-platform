/**
 * Seed de desenvolvimento (docs/ESPECIFICACAO.md §15.6). Tudo com domínio
 * @demo.rzrtdigital.com e senha aleatória impressa no terminal — nunca senha
 * fixa, nunca dado real. Recusa rodar em produção (CLAUDE.md §4.11).
 */
import { randomBytes } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { hashPassword } from "../src/lib/auth/password";

if (process.env.NODE_ENV === "production") {
  console.error("✖ Abortado: seed não pode rodar com NODE_ENV=production.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_DOMAIN = "demo.rzrtdigital.com";

function randomPassword(): string {
  return randomBytes(12).toString("base64url");
}

async function main() {
  const printedCredentials: Array<{ label: string; email: string; password: string }> = [];

  async function upsertUser(params: {
    name: string;
    email: string;
    type: "INTERNAL" | "CLIENT";
  }) {
    const password = randomPassword();
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email: params.email },
      create: {
        name: params.name,
        email: params.email,
        passwordHash,
        type: params.type,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
      update: {},
    });
    printedCredentials.push({ label: params.name, email: params.email, password });
    return user;
  }

  // --- Equipe interna ---------------------------------------------------
  const admin = await upsertUser({
    name: "Admin Demo",
    email: `admin@${DEMO_DOMAIN}`,
    type: "INTERNAL",
  });
  await prisma.internalUserProfile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, internalRole: "ADMIN", jobTitle: "Head de Operações" },
    update: {},
  });

  const manager = await upsertUser({
    name: "Gerente Demo",
    email: `gerente@${DEMO_DOMAIN}`,
    type: "INTERNAL",
  });
  await prisma.internalUserProfile.upsert({
    where: { userId: manager.id },
    create: { userId: manager.id, internalRole: "MANAGER", jobTitle: "Account Manager" },
    update: {},
  });

  // --- Organização cliente ------------------------------------------------
  const organization = await prisma.organization.upsert({
    where: { slug: "cliente-demo" },
    create: {
      name: "Cliente Demo",
      slug: "cliente-demo",
      legalName: "Cliente Demo Ltda.",
      status: "ACTIVE",
      onboardingCompletedAt: new Date(),
    },
    update: {},
  });

  await prisma.organizationAssignment.upsert({
    where: {
      organizationId_userId_assignmentType: {
        organizationId: organization.id,
        userId: manager.id,
        assignmentType: "ACCOUNT_MANAGER",
      },
    },
    create: {
      organizationId: organization.id,
      userId: manager.id,
      assignmentType: "ACCOUNT_MANAGER",
    },
    update: {},
  });

  const clientAdmin = await upsertUser({
    name: "Cliente Admin Demo",
    email: `cliente.admin@${DEMO_DOMAIN}`,
    type: "CLIENT",
  });
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: clientAdmin.id, organizationId: organization.id } },
    create: {
      userId: clientAdmin.id,
      organizationId: organization.id,
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
    update: {},
  });

  const clientMember = await upsertUser({
    name: "Cliente Membro Demo",
    email: `cliente.membro@${DEMO_DOMAIN}`,
    type: "CLIENT",
  });
  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: clientMember.id, organizationId: organization.id } },
    create: {
      userId: clientMember.id,
      organizationId: organization.id,
      role: "CLIENT_MEMBER",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
    update: {},
  });

  // --- Uma segunda organização, para os testes de isolamento entre tenants ---
  const organizationB = await prisma.organization.upsert({
    where: { slug: "cliente-demo-b" },
    create: {
      name: "Cliente Demo B",
      slug: "cliente-demo-b",
      status: "ACTIVE",
      onboardingCompletedAt: new Date(),
    },
    update: {},
  });
  const clientAdminB = await upsertUser({
    name: "Cliente Admin Demo B",
    email: `cliente.admin.b@${DEMO_DOMAIN}`,
    type: "CLIENT",
  });
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: { userId: clientAdminB.id, organizationId: organizationB.id },
    },
    create: {
      userId: clientAdminB.id,
      organizationId: organizationB.id,
      role: "CLIENT_ADMIN",
      status: "ACTIVE",
      joinedAt: new Date(),
    },
    update: {},
  });

  console.log("\n✓ Seed concluído. Credenciais geradas (senha aleatória, válida só neste ambiente):\n");
  for (const cred of printedCredentials) {
    console.log(`  ${cred.label.padEnd(24)} ${cred.email.padEnd(32)} ${cred.password}`);
  }
  console.log("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
