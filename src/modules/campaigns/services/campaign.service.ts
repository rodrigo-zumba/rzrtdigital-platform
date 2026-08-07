import type { CampaignStatus } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { NotFoundError } from "@/lib/errors";
import { assertOrganizationAccess, requirePermission } from "@/lib/permissions";
import { manualMetricsProvider } from "@/modules/campaigns/integrations/manual-provider";
import type { DailyMetricInput } from "@/modules/campaigns/integrations/metrics-provider";
import {
  countCampaigns,
  createCampaign as createCampaignRow,
  findCampaignById,
  listCampaigns as listCampaignsRows,
  softDeleteCampaign,
  updateCampaignStatus,
  type CampaignWriteInput,
} from "@/modules/campaigns/repositories/campaign.repository";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";

const PAGE_SIZE = 20;

export async function listCampaigns(ctx: RequestContext, organizationId: string, page: number) {
  requirePermission(ctx, "campaigns.read");
  assertOrganizationAccess(ctx, organizationId);

  const [items, total] = await Promise.all([
    listCampaignsRows(organizationId, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countCampaigns(organizationId),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCampaign(ctx: RequestContext, organizationId: string, campaignId: string) {
  requirePermission(ctx, "campaigns.read");
  assertOrganizationAccess(ctx, organizationId);

  const campaign = await findCampaignById(organizationId, campaignId);
  if (!campaign || campaign.deletedAt) throw new NotFoundError("Campanha não encontrada.");

  return campaign;
}

export async function createCampaign(ctx: RequestContext, organizationId: string, input: CampaignWriteInput) {
  requirePermission(ctx, "campaigns.create");
  assertOrganizationAccess(ctx, organizationId);

  const campaign = await createCampaignRow(organizationId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "campaign.create",
    entityType: "Campaign",
    entityId: campaign.id,
    metadata: { name: campaign.name, platform: campaign.platform },
  });

  return campaign;
}

async function assertCampaignInOrganization(organizationId: string, campaignId: string) {
  const campaign = await findCampaignById(organizationId, campaignId);
  if (!campaign || campaign.deletedAt) throw new NotFoundError("Campanha não encontrada.");
  return campaign;
}

export async function setCampaignStatus(
  ctx: RequestContext,
  organizationId: string,
  campaignId: string,
  status: CampaignStatus,
) {
  requirePermission(ctx, "campaigns.update");
  assertOrganizationAccess(ctx, organizationId);
  const current = await assertCampaignInOrganization(organizationId, campaignId);
  if (current.status === status) return current;

  const campaign = await updateCampaignStatus(organizationId, campaignId, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "campaign.status_change",
    entityType: "Campaign",
    entityId: campaignId,
    metadata: { from: current.status, to: status },
  });

  return campaign;
}

export async function archiveCampaign(ctx: RequestContext, organizationId: string, campaignId: string) {
  requirePermission(ctx, "campaigns.archive");
  assertOrganizationAccess(ctx, organizationId);
  await assertCampaignInOrganization(organizationId, campaignId);

  await softDeleteCampaign(organizationId, campaignId);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "campaign.archive",
    entityType: "Campaign",
    entityId: campaignId,
    metadata: {},
  });
}

/**
 * `metrics.write` (MANAGER/ANALYST/SUPER_ADMIN/ADMIN) — nunca fala com o
 * banco direto, passa pelo provider (manualMetricsProvider hoje; um
 * provider de API externa no futuro, mesma assinatura).
 */
export async function addManualMetric(
  ctx: RequestContext,
  organizationId: string,
  campaignId: string,
  input: DailyMetricInput,
) {
  requirePermission(ctx, "metrics.write");
  assertOrganizationAccess(ctx, organizationId);
  await assertCampaignInOrganization(organizationId, campaignId);

  const metric = await manualMetricsProvider.upsertDailyMetric(campaignId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "metric.upsert",
    entityType: "CampaignMetric",
    entityId: campaignId,
    metadata: { date: input.date.toISOString().slice(0, 10), source: "MANUAL" },
  });

  return metric;
}
