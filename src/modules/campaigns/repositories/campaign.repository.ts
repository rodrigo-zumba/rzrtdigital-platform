import type { CampaignPlatform, CampaignStatus, MetricSource } from "@prisma/client";

import { db } from "@/lib/db";

export type CampaignWriteInput = {
  name: string;
  platform: CampaignPlatform;
  objective?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
};

export function listCampaigns(organizationId: string, params: { skip: number; take: number }) {
  return db.campaign.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countCampaigns(organizationId: string) {
  return db.campaign.count({ where: { organizationId } });
}

export function createCampaign(organizationId: string, input: CampaignWriteInput) {
  return db.campaign.create({
    data: {
      organizationId,
      name: input.name,
      platform: input.platform,
      objective: input.objective ?? null,
      projectId: input.projectId ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      budget: input.budget ?? null,
    },
  });
}

export function findCampaignById(organizationId: string, campaignId: string) {
  return db.campaign.findFirst({
    where: { id: campaignId, organizationId },
    include: { metrics: { orderBy: { date: "desc" }, take: 30 } },
  });
}

export function updateCampaignStatus(organizationId: string, campaignId: string, status: CampaignStatus) {
  return db.campaign.update({ where: { id: campaignId, organizationId }, data: { status } });
}

export function softDeleteCampaign(organizationId: string, campaignId: string) {
  return db.campaign.update({ where: { id: campaignId, organizationId }, data: { deletedAt: new Date() } });
}

/**
 * Upsert por (campaignId, date, source) — chave única do modelo. Usado pelo
 * provider MANUAL (src/modules/campaigns/integrations); um provider futuro
 * de API externa chamaria a mesma função com `source` diferente de MANUAL,
 * nunca escrevendo direto no banco fora do repository.
 */
export function upsertMetric(
  campaignId: string,
  date: Date,
  source: MetricSource,
  data: { impressions: number; reach?: number; clicks: number; leads: number; conversions: number; spend: number; revenue?: number },
) {
  return db.campaignMetric.upsert({
    where: { campaignId_date_source: { campaignId, date, source } },
    create: { campaignId, date, source, ...data },
    update: data,
  });
}

/**
 * Módulo de campanhas (páginas, CRUD) é Fase 4. Este repository só tem as
 * agregações que o dashboard (Etapa 4) precisa.
 */
export function countActiveCampaigns(organizationIds?: string[]) {
  return db.campaign.count({
    where: { organizationId: organizationIds ? { in: organizationIds } : undefined, status: "ACTIVE" },
  });
}

/**
 * CampaignMetric não é tenant-scoped diretamente (deriva o tenant de
 * Campaign — docs/ESPECIFICACAO.md §5, nota do modelo Task/CampaignMetric),
 * então o tenant guard não intercepta esta query: o filtro por organização
 * é feito manualmente aqui, via join em `campaign.organizationId`.
 */
export async function sumLeadsSince(organizationIds: string[] | undefined, since: Date) {
  const result = await db.campaignMetric.aggregate({
    where: {
      date: { gte: since },
      campaign: {
        organizationId: organizationIds ? { in: organizationIds } : undefined,
        deletedAt: null,
      },
    },
    _sum: { leads: true },
  });

  return result._sum.leads ?? 0;
}
