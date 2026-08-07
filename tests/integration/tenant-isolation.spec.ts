import { randomBytes } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { db } from "@/lib/db";
import {
  changeOrganizationStatus,
  createOrganization,
  deleteOrganization,
  getOrganization,
  updateOrganization,
} from "@/modules/organizations/services/organization.service";

/**
 * Etapa 5 (docs/PROMPTS.md): itera cenários de acesso cruzado entre
 * organizações. Fábrica com Org A e Org B; sessão de A tentando tocar
 * recurso de B via id passado explicitamente (equivalente a id na URL/body
 * de uma Server Action — este projeto não expõe Route Handlers de dado de
 * negócio, só Server Actions, então o "id no request" é o argumento
 * passado à service, não uma URL). Esperado: ForbiddenError/NotFoundError
 * em 100% dos casos, nunca sucesso.
 */
const suffix = randomBytes(4).toString("hex");
const testOrgIds: string[] = [];
let actorUserId: string;

beforeAll(async () => {
  const actor = await db.user.create({
    data: {
      name: "Ator de Teste",
      email: `ator-tenant-isolation-${suffix}@demo.rzrtdigital.com`,
      passwordHash: await hashPassword("senha-de-teste-123"),
      type: "INTERNAL",
      status: "ACTIVE",
      passwordChangedAt: new Date(),
    },
  });
  actorUserId = actor.id;
});

afterAll(async () => {
  await db.organization.deleteMany({ where: { id: { in: testOrgIds } } });
  await db.user.delete({ where: { id: actorUserId } });
});

function internalCtx(overrides: Partial<Extract<RequestContext, { kind: "INTERNAL" }>>): RequestContext {
  return {
    kind: "INTERNAL",
    userId: actorUserId,
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
    userId: actorUserId,
    name: "Teste",
    email: "teste@demo.rzrtdigital.com",
    avatarUrl: null,
    memberships: [],
    ...overrides,
  };
}

async function createOrg(label: string) {
  const org = await db.organization.create({
    data: { name: `Org ${label} ${suffix}`, slug: `org-${label.toLowerCase()}-${suffix}` },
  });
  testOrgIds.push(org.id);
  return org;
}

describe("tenant isolation — organizations", () => {
  it("MANAGER com carteira só na Org A não lê, edita, arquiva nem exclui a Org B", async () => {
    const orgA = await createOrg("a-manager");
    const orgB = await createOrg("b-manager");
    const ctx = internalCtx({
      internalRole: "MANAGER",
      assignments: [{ organizationId: orgA.id, assignmentType: "ACCOUNT_MANAGER" }],
    });

    await expect(getOrganization(ctx, orgB.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      updateOrganization(ctx, orgB.id, { name: "Hackeado", slug: `hack-${suffix}` }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeOrganizationStatus(ctx, orgB.id, "SUSPENDED")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(deleteOrganization(ctx, orgB.id)).rejects.toBeInstanceOf(ForbiddenError);

    const untouched = await db.organization.findUnique({ where: { id: orgB.id } });
    expect(untouched?.name).toBe(orgB.name);
    expect(untouched?.status).toBe("ONBOARDING");
    expect(untouched?.deletedAt).toBeNull();
  });

  it("ANALYST sem organizations.read não lista nem lê nenhuma organização", async () => {
    const orgA = await createOrg("a-analyst");
    const ctx = internalCtx({
      internalRole: "ANALYST",
      assignments: [{ organizationId: orgA.id, assignmentType: "ACCOUNT_MANAGER" }],
    });

    await expect(getOrganization(ctx, orgA.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("CLIENT nunca acessa organizations.* mesmo sendo CLIENT_ADMIN da própria organização", async () => {
    const orgA = await createOrg("a-client");
    const ctx = clientCtx({
      memberships: [{ organizationId: orgA.id, organizationName: orgA.name, role: "CLIENT_ADMIN", status: "ACTIVE" }],
    });

    await expect(getOrganization(ctx, orgA.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateOrganization(ctx, orgA.id, { name: "X", slug: `x-${suffix}` })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("ADMIN não SUPER_ADMIN não exclui organização mesmo com organizations.delete negado pela matriz", async () => {
    const orgA = await createOrg("a-admin-delete");
    const ctx = internalCtx({ internalRole: "ADMIN" });

    await expect(deleteOrganization(ctx, orgA.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("organização já soft-deleted não é lida, editada nem tem status alterado por ninguém", async () => {
    const orgA = await createOrg("a-deleted");
    const superAdminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });
    await deleteOrganization(superAdminCtx, orgA.id);

    await expect(getOrganization(superAdminCtx, orgA.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      updateOrganization(superAdminCtx, orgA.id, { name: "Reviver", slug: `reviver-${suffix}` }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(changeOrganizationStatus(superAdminCtx, orgA.id, "ACTIVE")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("slug duplicado entre organizações é rejeitado (evita colisão cross-tenant de identificador)", async () => {
    const superAdminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });
    const orgA = await createOrganization(superAdminCtx, { name: "Original", slug: `dup-slug-${suffix}` });
    testOrgIds.push(orgA.id);

    await expect(
      createOrganization(superAdminCtx, { name: "Duplicada", slug: `dup-slug-${suffix}` }),
    ).rejects.toThrow();
  });
});
