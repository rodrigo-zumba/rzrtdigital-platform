import { db } from "@/lib/db";

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
