import type { OrganizationStatus } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertOrganizationAccess, requirePermission, resolveOrganizationScope } from "@/lib/permissions";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  countOrganizations,
  createOrganization as createOrganizationRow,
  findBySlug,
  findById,
  listOrganizations as listOrganizationsRows,
  softDeleteOrganization,
  updateOrganization as updateOrganizationRow,
  updateOrganizationStatus,
  type OrganizationWriteInput,
} from "@/modules/organizations/repositories/organization.repository";

const PAGE_SIZE = 20;

export async function listOrganizations(
  ctx: RequestContext,
  params: { q?: string; status?: OrganizationStatus; page: number },
) {
  requirePermission(ctx, "organizations.read");

  const organizationIds = resolveOrganizationScope(ctx);
  const filters = { q: params.q, status: params.status, organizationIds };

  const [items, total] = await Promise.all([
    listOrganizationsRows(filters, { skip: (params.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countOrganizations(filters),
  ]);

  return { items, total, page: params.page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getOrganization(ctx: RequestContext, organizationId: string) {
  requirePermission(ctx, "organizations.read");
  assertOrganizationAccess(ctx, organizationId);

  const organization = await findById(organizationId);
  if (!organization || organization.deletedAt) throw new NotFoundError("Cliente não encontrado.");

  return organization;
}

async function assertSlugAvailable(slug: string, currentOrganizationId?: string) {
  const existing = await findBySlug(slug);
  if (existing && existing.id !== currentOrganizationId) {
    throw new ValidationError("Este identificador já está em uso por outro cliente.");
  }
}

export async function createOrganization(ctx: RequestContext, input: OrganizationWriteInput) {
  requirePermission(ctx, "organizations.create");
  await assertSlugAvailable(input.slug);

  const organization = await createOrganizationRow(input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId: organization.id,
    action: "organization.create",
    entityType: "Organization",
    entityId: organization.id,
    metadata: { name: organization.name, slug: organization.slug },
  });

  return organization;
}

export async function updateOrganization(
  ctx: RequestContext,
  organizationId: string,
  input: OrganizationWriteInput,
) {
  requirePermission(ctx, "organizations.update");
  assertOrganizationAccess(ctx, organizationId);

  const current = await findById(organizationId);
  if (!current || current.deletedAt) throw new NotFoundError("Cliente não encontrado.");

  await assertSlugAvailable(input.slug, organizationId);

  const organization = await updateOrganizationRow(organizationId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "organization.update",
    entityType: "Organization",
    entityId: organizationId,
    metadata: { name: input.name, slug: input.slug },
  });

  return organization;
}

export async function changeOrganizationStatus(
  ctx: RequestContext,
  organizationId: string,
  status: OrganizationStatus,
) {
  requirePermission(ctx, "organizations.archive");
  assertOrganizationAccess(ctx, organizationId);

  const current = await findById(organizationId);
  if (!current || current.deletedAt) throw new NotFoundError("Cliente não encontrado.");
  if (current.status === status) return current;

  const organization = await updateOrganizationStatus(organizationId, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "organization.status_change",
    entityType: "Organization",
    entityId: organizationId,
    metadata: { from: current.status, to: status },
  });

  return organization;
}

/**
 * Soft delete — exclusivo de SUPER_ADMIN (docs/ESPECIFICACAO.md §3, matriz
 * de permissões: `organizations.delete` fora de ADMIN_PERMISSIONS).
 */
export async function deleteOrganization(ctx: RequestContext, organizationId: string) {
  requirePermission(ctx, "organizations.delete");

  const current = await findById(organizationId);
  if (!current || current.deletedAt) throw new NotFoundError("Cliente não encontrado.");

  if (ctx.kind !== "INTERNAL" || ctx.internalRole !== "SUPER_ADMIN") {
    // Rede de segurança: a matriz já bloqueia isso via requirePermission,
    // mas o dado é sensível o bastante para não depender só da matriz.
    throw new ForbiddenError();
  }

  await softDeleteOrganization(organizationId);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "organization.delete",
    entityType: "Organization",
    entityId: organizationId,
    metadata: { name: current.name, slug: current.slug },
  });
}

