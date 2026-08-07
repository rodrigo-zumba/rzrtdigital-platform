import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission, resolveOrganizationScope } from "@/lib/permissions";
import { countActiveCampaigns, sumLeadsSince } from "@/modules/campaigns/repositories/campaign.repository";
import { countOrganizationsByStatus } from "@/modules/organizations/repositories/organization.repository";
import { getProjectStats } from "@/modules/projects/repositories/project.repository";
import { countOpenTickets } from "@/modules/tickets/repositories/ticket.repository";

const LEADS_WINDOW_DAYS = 30;

export type Section<T> = { status: "ok"; data: T } | { status: "forbidden" };

async function section<T>(allowed: boolean, loader: () => Promise<T>): Promise<Section<T>> {
  if (!allowed) return { status: "forbidden" };
  return { status: "ok", data: await loader() };
}

export type AdminDashboard = {
  clients: Section<Awaited<ReturnType<typeof countOrganizationsByStatus>>>;
  projects: Section<Awaited<ReturnType<typeof getProjectStats>>>;
  activeCampaigns: Section<number>;
  leadsLast30Days: Section<number>;
  openTickets: Section<number>;
};

/**
 * Dashboard admin (Etapa 4): cada card tem sua própria permissão. Um card
 * sem permissão vira `{ status: "forbidden" }` — o dashboard fica parcial,
 * não quebra por inteiro (docs/PROMPTS.md Etapa 4: estados "forbidden" e
 * "partial" são requisito, não só o caminho feliz).
 */
export async function getAdminDashboard(ctx: RequestContext): Promise<AdminDashboard> {
  if (ctx.kind !== "INTERNAL") throw new ForbiddenError();

  const organizationIds = resolveOrganizationScope(ctx);
  const since = new Date();
  since.setDate(since.getDate() - LEADS_WINDOW_DAYS);

  const [clients, projects, activeCampaigns, leadsLast30Days, openTickets] = await Promise.all([
    section(hasPermission(ctx, "organizations.read"), () => countOrganizationsByStatus(organizationIds)),
    section(hasPermission(ctx, "projects.read"), () => getProjectStats(organizationIds)),
    section(hasPermission(ctx, "campaigns.read"), () => countActiveCampaigns(organizationIds)),
    section(hasPermission(ctx, "metrics.read"), () => sumLeadsSince(organizationIds, since)),
    section(hasPermission(ctx, "tickets.read"), () => countOpenTickets(organizationIds)),
  ]);

  return { clients, projects, activeCampaigns, leadsLast30Days, openTickets };
}
