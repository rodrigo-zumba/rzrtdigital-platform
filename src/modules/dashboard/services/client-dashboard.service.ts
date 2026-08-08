import type { RequestContext } from "@/lib/auth/types";
import { assertOrganizationAccess, requirePermission } from "@/lib/permissions";
import { countActiveCampaigns, sumLeadsSince } from "@/modules/campaigns/repositories/campaign.repository";
import { getProjectStats } from "@/modules/projects/repositories/project.repository";
import { countOpenTickets } from "@/modules/tickets/repositories/ticket.repository";

const LEADS_WINDOW_DAYS = 30;

export type ClientDashboard = {
  leadsLast30Days: number;
  activeCampaigns: number;
  avgProjectProgress: number | null;
  openTickets: number;
};

/**
 * Dashboard do cliente (Etapa 4), escopado a uma única organização — o
 * workspace selecionado (src/lib/auth/workspace.ts). Todos os papéis de
 * CLIENT têm as permissões usadas aqui (docs/ESPECIFICACAO.md §4), então,
 * diferente do dashboard admin, não há seção "forbidden" — só vazio/real.
 */
export async function getClientDashboard(ctx: RequestContext, organizationId: string): Promise<ClientDashboard> {
  requirePermission(ctx, "projects.read", organizationId);
  requirePermission(ctx, "campaigns.read", organizationId);
  requirePermission(ctx, "metrics.read", organizationId);
  requirePermission(ctx, "tickets.read", organizationId);
  assertOrganizationAccess(ctx, organizationId);

  const since = new Date();
  since.setDate(since.getDate() - LEADS_WINDOW_DAYS);

  const [projectStats, activeCampaigns, leadsLast30Days, openTickets] = await Promise.all([
    getProjectStats([organizationId]),
    countActiveCampaigns([organizationId]),
    sumLeadsSince([organizationId], since),
    countOpenTickets([organizationId]),
  ]);

  return {
    leadsLast30Days,
    activeCampaigns,
    avgProjectProgress: projectStats.avgProgressInProgress,
    openTickets,
  };
}
