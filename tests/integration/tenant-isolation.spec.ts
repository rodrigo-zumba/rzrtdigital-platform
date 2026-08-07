import { randomBytes } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { hashPassword } from "@/lib/auth/password";
import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { db } from "@/lib/db";
import { createAssignment } from "@/modules/organizations/services/assignment.service";
import {
  changeOrganizationStatus,
  createOrganization,
  deleteOrganization,
  getOrganization,
  updateOrganization,
} from "@/modules/organizations/services/organization.service";
import {
  removeMember,
  setInternalUserStatus,
  setMemberStatus,
  updateInternalUserRole,
  updateMemberRole,
} from "@/modules/users/services/user.service";
import { createProject, getProject, updateProject } from "@/modules/projects/services/project.service";
import { createCampaign, getCampaign } from "@/modules/campaigns/services/campaign.service";
import { createReport, getReport, setReportStatus } from "@/modules/reports/services/report.service";
import { createTicket, getTicket } from "@/modules/tickets/services/ticket.service";

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

describe("tenant isolation — usuários e atribuições (Fase 2)", () => {
  it("MANAGER com carteira só na Org A não gerencia membro nem atribuição da Org B", async () => {
    const orgA = await createOrg("a-users");
    const orgB = await createOrg("b-users");
    const managerCtx = internalCtx({
      internalRole: "MANAGER",
      assignments: [{ organizationId: orgA.id, assignmentType: "ACCOUNT_MANAGER" }],
    });

    const member = await db.user.create({
      data: {
        name: "Membro Org B",
        email: `membro-orgb-${suffix}@demo.rzrtdigital.com`,
        type: "CLIENT",
        status: "ACTIVE",
      },
    });
    await db.organizationMember.create({
      data: { userId: member.id, organizationId: orgB.id, role: "CLIENT_MEMBER", status: "ACTIVE" },
    });

    await expect(updateMemberRole(managerCtx, orgB.id, member.id, "CLIENT_ADMIN")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(setMemberStatus(managerCtx, orgB.id, member.id, "SUSPENDED")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(removeMember(managerCtx, orgB.id, member.id)).rejects.toBeInstanceOf(ForbiddenError);

    // assignments.manage é exclusivo de ADMIN/SUPER_ADMIN — MANAGER não gerencia
    // nem a própria carteira, em nenhuma organização.
    await expect(createAssignment(managerCtx, orgA.id, member.id, "ACCOUNT_MANAGER")).rejects.toBeInstanceOf(
      ForbiddenError,
    );

    await db.user.delete({ where: { id: member.id } });
  });

  it("CLIENT_ADMIN da Org A não gerencia membro da Org B mesmo conhecendo o id", async () => {
    const orgA = await createOrg("a-client-admin");
    const orgB = await createOrg("b-client-admin");
    const clientAdminCtx = clientCtx({
      memberships: [{ organizationId: orgA.id, organizationName: orgA.name, role: "CLIENT_ADMIN", status: "ACTIVE" }],
    });

    const memberB = await db.user.create({
      data: {
        name: "Membro Org B 2",
        email: `membro-orgb2-${suffix}@demo.rzrtdigital.com`,
        type: "CLIENT",
        status: "ACTIVE",
      },
    });
    await db.organizationMember.create({
      data: { userId: memberB.id, organizationId: orgB.id, role: "CLIENT_MEMBER", status: "ACTIVE" },
    });

    await expect(updateMemberRole(clientAdminCtx, orgB.id, memberB.id, "CLIENT_VIEWER")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(removeMember(clientAdminCtx, orgB.id, memberB.id)).rejects.toBeInstanceOf(ForbiddenError);

    await db.user.delete({ where: { id: memberB.id } });
  });

  it("ADMIN não concede papel SUPER_ADMIN a outro usuário (escalada de privilégio)", async () => {
    const adminCtx = internalCtx({ internalRole: "ADMIN" });
    const target = await db.user.create({
      data: {
        name: "Alvo",
        email: `alvo-escalada-${suffix}@demo.rzrtdigital.com`,
        type: "INTERNAL",
        status: "ACTIVE",
      },
    });
    await db.internalUserProfile.create({ data: { userId: target.id, internalRole: "ANALYST" } });

    await expect(updateInternalUserRole(adminCtx, target.id, "SUPER_ADMIN")).rejects.toBeInstanceOf(ForbiddenError);

    await db.user.delete({ where: { id: target.id } });
  });

  it("ninguém suspende ou rebaixa o último SUPER_ADMIN ativo", async () => {
    // Suspende temporariamente qualquer SUPER_ADMIN pré-existente (seed) para
    // que o cenário seja determinístico, e restaura no fim do teste.
    const otherActiveSuperAdmins = await db.user.findMany({
      where: { type: "INTERNAL", status: "ACTIVE", internalProfile: { internalRole: "SUPER_ADMIN" } },
      select: { id: true },
    });
    await db.user.updateMany({
      where: { id: { in: otherActiveSuperAdmins.map((admin) => admin.id) } },
      data: { status: "SUSPENDED" },
    });

    const lastSuperAdmin = await db.user.create({
      data: {
        name: "Último Super Admin",
        email: `ultimo-superadmin-${suffix}@demo.rzrtdigital.com`,
        type: "INTERNAL",
        status: "ACTIVE",
      },
    });
    await db.internalUserProfile.create({ data: { userId: lastSuperAdmin.id, internalRole: "SUPER_ADMIN" } });

    const otherSuperAdminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });

    await expect(setInternalUserStatus(otherSuperAdminCtx, lastSuperAdmin.id, "SUSPENDED")).rejects.toThrow();
    await expect(updateInternalUserRole(otherSuperAdminCtx, lastSuperAdmin.id, "ADMIN")).rejects.toThrow();

    await db.user.delete({ where: { id: lastSuperAdmin.id } });
    await db.user.updateMany({
      where: { id: { in: otherActiveSuperAdmins.map((admin) => admin.id) } },
      data: { status: "ACTIVE" },
    });
  });
});

describe("tenant isolation — projetos, campanhas, relatórios, chamados (Fase 4)", () => {
  it("MANAGER com carteira só na Org A não lê nem edita projeto/campanha da Org B", async () => {
    const orgA = await createOrg("a-fase4-proj");
    const orgB = await createOrg("b-fase4-proj");
    const adminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });

    const project = await createProject(adminCtx, orgB.id, { name: "Projeto B", type: "OUTRO", priority: "MEDIUM" });
    const campaign = await createCampaign(adminCtx, orgB.id, { name: "Campanha B", platform: "META_ADS" });

    const managerCtx = internalCtx({
      internalRole: "MANAGER",
      assignments: [{ organizationId: orgA.id, assignmentType: "ACCOUNT_MANAGER" }],
    });

    await expect(getProject(managerCtx, orgB.id, project.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      updateProject(managerCtx, orgB.id, project.id, { name: "Hackeado", type: "OUTRO", priority: "LOW" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getCampaign(managerCtx, orgB.id, campaign.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("projeto e campanha passados com organizationId da Org A mas id da Org B não vazam dado (IDOR)", async () => {
    const orgA = await createOrg("a-fase4-idor");
    const orgB = await createOrg("b-fase4-idor");
    const adminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });

    const projectB = await createProject(adminCtx, orgB.id, { name: "Projeto IDOR B", type: "OUTRO", priority: "MEDIUM" });

    // Mesmo um SUPER_ADMIN (acesso irrestrito à organização) não encontra o
    // projeto de B se o organizationId informado for o de A — o service
    // sempre resolve o projeto pelo par (id, organizationId), nunca só pelo id.
    await expect(getProject(adminCtx, orgA.id, projectB.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("CLIENT nunca vê relatório DRAFT, nem da própria organização", async () => {
    const orgA = await createOrg("a-fase4-report");
    const adminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });
    const report = await createReport(adminCtx, orgA.id, {
      title: "Relatório Draft",
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      content: "conteúdo",
    });

    const clientCtxA = clientCtx({
      memberships: [{ organizationId: orgA.id, organizationName: orgA.name, role: "CLIENT_ADMIN", status: "ACTIVE" }],
    });

    await expect(getReport(clientCtxA, orgA.id, report.id)).rejects.toBeInstanceOf(ForbiddenError);

    await setReportStatus(adminCtx, orgA.id, report.id, "REVIEW");
    await setReportStatus(adminCtx, orgA.id, report.id, "PUBLISHED");

    const published = await getReport(clientCtxA, orgA.id, report.id);
    expect(published.status).toBe("PUBLISHED");
  });

  it("CLIENT de outra organização não lê relatório publicado da Org A", async () => {
    const orgA = await createOrg("a-fase4-report-cross");
    const orgB = await createOrg("b-fase4-report-cross");
    const adminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });
    const report = await createReport(adminCtx, orgA.id, {
      title: "Relatório Publicado A",
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-01-31"),
      content: "conteúdo",
    });
    await setReportStatus(adminCtx, orgA.id, report.id, "REVIEW");
    await setReportStatus(adminCtx, orgA.id, report.id, "PUBLISHED");

    const clientCtxB = clientCtx({
      memberships: [{ organizationId: orgB.id, organizationName: orgB.name, role: "CLIENT_ADMIN", status: "ACTIVE" }],
    });

    await expect(getReport(clientCtxB, orgA.id, report.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("CLIENT nunca vê TicketMessage.isInternal, mesmo no próprio chamado", async () => {
    const orgA = await createOrg("a-fase4-ticket");
    const adminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });
    const ticket = await createTicket(adminCtx, orgA.id, {
      subject: "Chamado teste",
      description: "Descrição",
      category: "GENERAL",
      priority: "MEDIUM",
    });

    await db.ticketMessage.create({
      data: { ticketId: ticket.id, authorId: adminCtx.userId, message: "Nota interna", isInternal: true },
    });
    await db.ticketMessage.create({
      data: { ticketId: ticket.id, authorId: adminCtx.userId, message: "Resposta pública", isInternal: false },
    });

    const clientCtxA = clientCtx({
      memberships: [{ organizationId: orgA.id, organizationName: orgA.name, role: "CLIENT_ADMIN", status: "ACTIVE" }],
    });

    const ticketForClient = await getTicket(clientCtxA, orgA.id, ticket.id);
    expect(ticketForClient.messages).toHaveLength(1);
    expect(ticketForClient.messages[0]?.isInternal).toBe(false);

    const ticketForAdmin = await getTicket(adminCtx, orgA.id, ticket.id);
    expect(ticketForAdmin.messages).toHaveLength(2);
  });

  it("CLIENT de outra organização não acessa chamado da Org A", async () => {
    const orgA = await createOrg("a-fase4-ticket-cross");
    const orgB = await createOrg("b-fase4-ticket-cross");
    const adminCtx = internalCtx({ internalRole: "SUPER_ADMIN" });
    const ticket = await createTicket(adminCtx, orgA.id, {
      subject: "Chamado A",
      description: "Descrição",
      category: "GENERAL",
      priority: "MEDIUM",
    });

    const clientCtxB = clientCtx({
      memberships: [{ organizationId: orgB.id, organizationName: orgB.name, role: "CLIENT_ADMIN", status: "ACTIVE" }],
    });

    await expect(getTicket(clientCtxB, orgA.id, ticket.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
