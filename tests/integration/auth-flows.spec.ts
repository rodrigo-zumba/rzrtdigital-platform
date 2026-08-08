import { randomBytes } from "node:crypto";

import type { InternalRole, MemberRole } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import type { RequestContext } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { hasPermission, type Permission } from "@/lib/permissions";
import { generateToken } from "@/lib/security/tokens";
import { attemptLogin } from "@/modules/auth/services/login.service";
import { resetPassword } from "@/modules/auth/services/password-reset.service";
import {
  acceptInvitation,
  inviteClientToOrganization,
  previewInvitation,
} from "@/modules/invitations/services/invitation.service";

const suffix = randomBytes(4).toString("hex");
const testUserIds: string[] = [];
const testOrgIds: string[] = [];

afterAll(async () => {
  await db.organizationMember.deleteMany({
    where: { organizationId: { in: testOrgIds } },
  });
  for (const organizationId of testOrgIds) {
    await db.invitation.deleteMany({ where: { organizationId } });
  }
  await db.user.deleteMany({ where: { id: { in: testUserIds } } });
  for (const organizationId of testOrgIds) {
    await db.organization.delete({ where: { id: organizationId } });
  }
});

async function createTestUser(params: { email: string; password: string; status?: "ACTIVE" | "SUSPENDED" }) {
  const user = await db.user.create({
    data: {
      name: "Teste",
      email: params.email,
      passwordHash: await hashPassword(params.password),
      type: "INTERNAL",
      status: params.status ?? "ACTIVE",
      passwordChangedAt: new Date(),
    },
  });
  testUserIds.push(user.id);
  return user;
}

function internalCtx(overrides: Partial<Extract<RequestContext, { kind: "INTERNAL" }>>): RequestContext {
  return {
    kind: "INTERNAL",
    userId: "test",
    name: "Teste",
    email: "teste@demo.rzrtdigital.com",
    avatarUrl: null,
    internalRole: "ADMIN",
    assignments: [],
    ...overrides,
  };
}

function clientCtx(overrides: Partial<Extract<RequestContext, { kind: "CLIENT" }>>): RequestContext {
  return {
    kind: "CLIENT",
    userId: "test",
    name: "Teste",
    email: "teste@demo.rzrtdigital.com",
    avatarUrl: null,
    memberships: [],
    ...overrides,
  };
}

// docs/ESPECIFICACAO.md §13.2 — matriz de permissões tabelada.
describe("matriz de permissões", () => {
  const internalCases: Array<[role: InternalRole, permission: Permission, expected: boolean]> = [
    ["SUPER_ADMIN", "settings.global.manage", true],
    ["SUPER_ADMIN", "auditLogs.read", true],
    ["ADMIN", "settings.global.manage", false],
    ["ADMIN", "auditLogs.read", false],
    ["ADMIN", "organizations.delete", false],
    ["ADMIN", "organizations.archive", true],
    ["MANAGER", "users.invite", false],
    ["MANAGER", "reports.publish", true],
    ["ANALYST", "reports.publish", false],
    ["ANALYST", "metrics.write", true],
    ["ANALYST", "users.invite", false],
  ];

  for (const [role, permission, expected] of internalCases) {
    it(`INTERNAL ${role} ${expected ? "tem" : "não tem"} ${permission}`, () => {
      const ctx = internalCtx({ internalRole: role });
      expect(hasPermission(ctx, permission)).toBe(expected);
    });
  }

  const clientCases: Array<[role: MemberRole, permission: Permission, expected: boolean]> = [
    ["CLIENT_ADMIN", "users.invite", true],
    ["CLIENT_MEMBER", "users.invite", false],
    ["CLIENT_VIEWER", "users.invite", false],
    ["CLIENT_VIEWER", "tickets.create", false],
    ["CLIENT_MEMBER", "tickets.create", true],
    ["CLIENT_VIEWER", "files.download", true],
  ];

  for (const [role, permission, expected] of clientCases) {
    it(`CLIENT ${role} ${expected ? "tem" : "não tem"} ${permission}`, () => {
      const ctx = clientCtx({
        memberships: [{ organizationId: "org_1", organizationName: "Org", role, status: "ACTIVE" }],
      });
      expect(hasPermission(ctx, permission, "org_1")).toBe(expected);
    });
  }
});

// Regressão: hasPermission não pode herdar o papel mais permissivo entre
// organizações diferentes. CLIENT_ADMIN em A + CLIENT_VIEWER em B não pode
// operar em B como se fosse admin.
describe("hasPermission: isolamento entre organizações (CLIENT)", () => {
  const ctx = clientCtx({
    memberships: [
      { organizationId: "org_a", organizationName: "Org A", role: "CLIENT_ADMIN", status: "ACTIVE" },
      { organizationId: "org_b", organizationName: "Org B", role: "CLIENT_VIEWER", status: "ACTIVE" },
    ],
  });

  it("permite users.invite em A (CLIENT_ADMIN)", () => {
    expect(hasPermission(ctx, "users.invite", "org_a")).toBe(true);
  });

  it("bloqueia users.invite em B (CLIENT_VIEWER) mesmo sendo CLIENT_ADMIN em A", () => {
    expect(hasPermission(ctx, "users.invite", "org_b")).toBe(false);
  });

  it("permite users.remove em A (CLIENT_ADMIN)", () => {
    expect(hasPermission(ctx, "users.remove", "org_a")).toBe(true);
  });

  it("bloqueia users.remove em B (CLIENT_VIEWER) mesmo sendo CLIENT_ADMIN em A", () => {
    expect(hasPermission(ctx, "users.remove", "org_b")).toBe(false);
  });

  it("bloqueia qualquer permissão em organização sem membership", () => {
    expect(hasPermission(ctx, "users.invite", "org_c")).toBe(false);
    expect(hasPermission(ctx, "projects.read", "org_c")).toBe(false);
  });

  it("bloqueia se a membership na organização-alvo não está ACTIVE", () => {
    const inactiveCtx = clientCtx({
      memberships: [{ organizationId: "org_a", organizationName: "Org A", role: "CLIENT_ADMIN", status: "SUSPENDED" }],
    });
    expect(hasPermission(inactiveCtx, "users.invite", "org_a")).toBe(false);
  });

  // Sem organizationId, hasPermission não deve cair em fallback de "qualquer
  // membership ativa" — isso reabriria exatamente a escalada A → B que este
  // guard existe para impedir. Um call site que esqueça de passar a
  // organização deve negar, nunca herdar o CLIENT_ADMIN de outra org.
  it("nega (não herda CLIENT_ADMIN de A) quando organizationId é omitido no call site", () => {
    expect(hasPermission(ctx, "users.invite")).toBe(false);
    expect(hasPermission(ctx, "users.remove")).toBe(false);
  });
});

// docs/ESPECIFICACAO.md §13.5 — usuário suspenso perde acesso no request seguinte.
describe("login: usuário suspenso", () => {
  it("bloqueia login mesmo com senha correta", async () => {
    const email = `suspenso-${suffix}@demo.rzrtdigital.com`;
    const password = "SenhaForte123456";
    const user = await createTestUser({ email, password });

    const loggedIn = await attemptLogin({ email, password, ip: "127.0.0.1" });
    expect(loggedIn?.id).toBe(user.id);

    await db.user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } });

    const blocked = await attemptLogin({ email, password, ip: "127.0.0.1" });
    expect(blocked).toBeNull();
  });
});

// docs/ESPECIFICACAO.md §13.4 — reset de senha: válido, expirado, reutilizado.
describe("reset de senha", () => {
  it("token válido reseta a senha; reutilizar o mesmo token falha", async () => {
    const email = `reset-${suffix}@demo.rzrtdigital.com`;
    await createTestUser({ email, password: "SenhaAntiga123456" });

    const { token, tokenHash } = generateToken();
    const created = await db.passwordResetToken.create({
      data: {
        userId: testUserIds[testUserIds.length - 1] as string,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await resetPassword({ token, password: "SenhaNova123456" });

    const loggedInWithNewPassword = await attemptLogin({ email, password: "SenhaNova123456", ip: "127.0.0.1" });
    expect(loggedInWithNewPassword).not.toBeNull();

    await expect(resetPassword({ token, password: "OutraSenha123456" })).rejects.toThrow(
      /inválido, expirado ou já utilizado/,
    );

    await db.passwordResetToken.delete({ where: { id: created.id } });
  });

  it("token expirado é rejeitado", async () => {
    const email = `reset-expirado-${suffix}@demo.rzrtdigital.com`;
    await createTestUser({ email, password: "SenhaAntiga123456" });

    const { token, tokenHash } = generateToken();
    await db.passwordResetToken.create({
      data: {
        userId: testUserIds[testUserIds.length - 1] as string,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    await expect(resetPassword({ token, password: "SenhaNova123456" })).rejects.toThrow(/expirado/);
  });
});

// docs/ESPECIFICACAO.md §13.3 — convite: aceite válido, expirado, revogado, já usado.
describe("convites", () => {
  let orgCounter = 0;

  async function createOrg() {
    orgCounter += 1;
    const org = await db.organization.create({
      data: {
        name: `Org Teste ${suffix} ${orgCounter}`,
        slug: `org-teste-${suffix}-${orgCounter}`,
        status: "ACTIVE",
      },
    });
    testOrgIds.push(org.id);
    return org;
  }

  let invitedByPromise: ReturnType<typeof createTestUser> | undefined;

  async function createInvitedBy() {
    // Compartilhado entre os testes deste describe — só precisa existir uma vez.
    if (!invitedByPromise) {
      invitedByPromise = createTestUser({
        email: `convite-por-${suffix}@demo.rzrtdigital.com`,
        password: "SenhaForte123456",
      }).then(async (user) => {
        await db.internalUserProfile.create({ data: { userId: user.id, internalRole: "ADMIN" } });
        return user;
      });
    }
    return invitedByPromise;
  }

  it("bloqueia inviteClientToOrganization em B para CLIENT_ADMIN de A / CLIENT_VIEWER em B", async () => {
    const orgA = await createOrg();
    const orgB = await createOrg();

    const ctx = clientCtx({
      memberships: [
        { organizationId: orgA.id, organizationName: orgA.name, role: "CLIENT_ADMIN", status: "ACTIVE" },
        { organizationId: orgB.id, organizationName: orgB.name, role: "CLIENT_VIEWER", status: "ACTIVE" },
      ],
    });

    await expect(
      inviteClientToOrganization(ctx, {
        email: `escalada-${suffix}@demo.rzrtdigital.com`,
        organizationId: orgB.id,
        role: "CLIENT_MEMBER",
      }),
    ).rejects.toThrow();
  });

  it("aceite válido cria o usuário e a membership", async () => {
    const org = await createOrg();
    const invitedBy = await createInvitedBy();
    const { token, tokenHash } = generateToken();
    const email = `convidado-valido-${suffix}@demo.rzrtdigital.com`;

    await db.invitation.create({
      data: {
        email,
        organizationId: org.id,
        targetType: "CLIENT",
        role: "CLIENT_MEMBER",
        tokenHash,
        invitedById: invitedBy.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    const preview = await previewInvitation(token);
    expect(preview.valid).toBe(true);

    const user = await acceptInvitation({ token, name: "Convidado Válido", password: "SenhaForte123456" });
    testUserIds.push(user.id);

    const membership = await db.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    });
    expect(membership?.role).toBe("CLIENT_MEMBER");
  });

  it("convite expirado é rejeitado", async () => {
    const org = await createOrg();
    const invitedBy = await createInvitedBy();
    const { token, tokenHash } = generateToken();

    await db.invitation.create({
      data: {
        email: `convidado-expirado-${suffix}@demo.rzrtdigital.com`,
        organizationId: org.id,
        targetType: "CLIENT",
        role: "CLIENT_MEMBER",
        tokenHash,
        invitedById: invitedBy.id,
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const preview = await previewInvitation(token);
    expect(preview.valid).toBe(false);
    await expect(acceptInvitation({ token, password: "SenhaForte123456" })).rejects.toThrow(/expirado/);
  });

  it("convite revogado é rejeitado", async () => {
    const org = await createOrg();
    const invitedBy = await createInvitedBy();
    const { token, tokenHash } = generateToken();

    const invitation = await db.invitation.create({
      data: {
        email: `convidado-revogado-${suffix}@demo.rzrtdigital.com`,
        organizationId: org.id,
        targetType: "CLIENT",
        role: "CLIENT_MEMBER",
        tokenHash,
        invitedById: invitedBy.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    await db.invitation.update({
      where: { id: invitation.id, organizationId: org.id },
      data: { status: "REVOKED", revokedAt: new Date() },
    });

    const preview = await previewInvitation(token);
    expect(preview.valid).toBe(false);
    await expect(acceptInvitation({ token, password: "SenhaForte123456" })).rejects.toThrow(
      /inválido, expirado ou já utilizado/,
    );
  });

  it("convite já aceito não pode ser aceito de novo", async () => {
    const org = await createOrg();
    const invitedBy = await createInvitedBy();
    const { token, tokenHash } = generateToken();

    await db.invitation.create({
      data: {
        email: `convidado-duplicado-${suffix}@demo.rzrtdigital.com`,
        organizationId: org.id,
        targetType: "CLIENT",
        role: "CLIENT_MEMBER",
        tokenHash,
        invitedById: invitedBy.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    const user = await acceptInvitation({ token, name: "Convidado Duplicado", password: "SenhaForte123456" });
    testUserIds.push(user.id);

    await expect(acceptInvitation({ token, password: "OutraSenha123456" })).rejects.toThrow();
  });
});
