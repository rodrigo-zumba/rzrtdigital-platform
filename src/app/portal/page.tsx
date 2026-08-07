import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StatCard } from "@/components/dashboard/StatCard";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { getClientDashboard } from "@/modules/dashboard/services/client-dashboard.service";

export const metadata: Metadata = { title: "Painel" };

const numberFormatter = new Intl.NumberFormat("pt-BR");

export default async function PortalHomePage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const membership = ctx.memberships.find((m) => m.organizationId === organizationId);
  const dashboard = await getClientDashboard(ctx, organizationId);

  const hasActivity =
    dashboard.leadsLast30Days > 0 || dashboard.activeCampaigns > 0 || dashboard.avgProjectProgress !== null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Bem-vindo, {ctx.name}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Organização: <strong className="text-text-primary">{membership?.organizationName}</strong>
        </p>
      </div>

      {!hasActivity && (
        <div className="surface-card p-6">
          <p className="text-sm text-text-secondary">
            Ainda não há dados de campanha ou projeto para exibir aqui. Assim que o time começar a trabalhar na sua
            conta, os números aparecem neste painel.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads (30 dias)" value={numberFormatter.format(dashboard.leadsLast30Days)} />
        <StatCard label="Campanhas ativas" value={numberFormatter.format(dashboard.activeCampaigns)} />
        <StatCard
          label="Progresso do projeto"
          value={dashboard.avgProjectProgress !== null ? `${Math.round(dashboard.avgProjectProgress)}%` : "—"}
          hint={dashboard.avgProjectProgress === null ? "Nenhum projeto em andamento" : undefined}
        />
        <StatCard label="Chamados abertos" value={numberFormatter.format(dashboard.openTickets)} />
      </div>
    </div>
  );
}
