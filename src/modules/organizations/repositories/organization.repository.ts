import type { OrganizationStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Organization é o próprio tenant — não está em TENANT_SCOPED_MODELS
 * (docs/ESPECIFICACAO.md §2), então nenhuma query aqui exige organizationId
 * no where. Está em SOFT_DELETE_MODELS: o guard já filtra deletedAt: null
 * por padrão nas leituras em lote.
 */
export function findById(organizationId: string) {
  return db.organization.findUnique({ where: { id: organizationId } });
}

export function findBySlug(slug: string) {
  return db.organization.findFirst({ where: { slug } });
}

export type OrganizationListFilters = {
  q?: string;
  status?: OrganizationStatus;
  organizationIds?: string[];
};

function listWhere(filters: OrganizationListFilters): Prisma.OrganizationWhereInput {
  return {
    ...(filters.organizationIds ? { id: { in: filters.organizationIds } } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { slug: { contains: filters.q, mode: "insensitive" } },
            { legalName: { contains: filters.q, mode: "insensitive" } },
            { document: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export function listOrganizations(filters: OrganizationListFilters, params: { skip: number; take: number }) {
  return db.organization.findMany({
    where: listWhere(filters),
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countOrganizations(filters: OrganizationListFilters) {
  return db.organization.count({ where: listWhere(filters) });
}

export type OrganizationWriteInput = {
  name: string;
  slug: string;
  legalName?: string;
  document?: string;
  website?: string;
  phone?: string;
  segment?: string;
};

/**
 * Campo opcional ausente/"" chega aqui como `undefined` — o Prisma ignora
 * chave `undefined` num `update` (mantém o valor atual), então convertemos
 * para `null` explícito para que limpar o campo no form realmente limpe.
 */
function toNullableFields(data: OrganizationWriteInput) {
  return {
    name: data.name,
    slug: data.slug,
    legalName: data.legalName ?? null,
    document: data.document ?? null,
    website: data.website ?? null,
    phone: data.phone ?? null,
    segment: data.segment ?? null,
  };
}

export function createOrganization(data: OrganizationWriteInput) {
  return db.organization.create({ data: toNullableFields(data) });
}

export function updateOrganization(organizationId: string, data: OrganizationWriteInput) {
  return db.organization.update({ where: { id: organizationId }, data: toNullableFields(data) });
}

export function updateOrganizationStatus(organizationId: string, status: OrganizationStatus) {
  return db.organization.update({
    where: { id: organizationId },
    data: { status, ...(status === "ACTIVE" ? { onboardingCompletedAt: new Date() } : {}) },
  });
}

export function softDeleteOrganization(organizationId: string) {
  return db.organization.update({
    where: { id: organizationId },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}
