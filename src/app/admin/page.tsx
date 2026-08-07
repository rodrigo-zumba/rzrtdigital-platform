import type { Metadata } from "next";
import Link from "next/link";

import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { requireRequestContext } from "@/lib/auth";
import { getAdminDashboard } from "@/modules/dashboard/services/admin-dashboard.service";

export const metadata: Metadata = { title: "Painel" };

const numberFormatter = new Intl.NumberFormat("pt-BR");

export default async function AdminHomePage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "INTERNAL") return null;

  const dashboard = await getAdminDashboard(ctx);
  const totalClients =
    dashboard.clients.status === "ok"
      ? Object.values(dashboard.clients.data).reduce((sum, count) => sum + count, 0)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Bem-vindo, {ctx.name}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Perfil interno: <strong className="text-text-primary">{ctx.internalRole}</strong>
        </p>
      </div>

      {dashboard.clients.status === "ok" && totalClients === 0 ? (
        <div className="surface-card flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-text-secondary">Nenhum cliente cadastrado ainda.</p>
          <Link href="/admin/clientes/novo">
            <Button>Cadastrar primeiro cliente</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Clientes ativos"
            value={dashboard.clients.status === "ok" ? numberFormatter.format(dashboard.clients.data.ACTIVE) : undefined}
            forbidden={dashboard.clients.status === "forbidden"}
            hint={dashboard.clients.status === "ok" ? `${numberFormatter.format(totalClients)} no total` : undefined}
          />
          <StatCard
            label="Projetos em andamento"
            value={
              dashboard.projects.status === "ok"
                ? numberFormatter.format(dashboard.projects.data.byStatus.IN_PROGRESS)
                : undefined
            }
            forbidden={dashboard.projects.status === "forbidden"}
            hint={
              dashboard.projects.status === "ok" && dashboard.projects.data.avgProgressInProgress !== null
                ? `${Math.round(dashboard.projects.data.avgProgressInProgress)}% de progresso médio`
                : undefined
            }
          />
          <StatCard
            label="Campanhas ativas"
            value={dashboard.activeCampaigns.status === "ok" ? numberFormatter.format(dashboard.activeCampaigns.data) : undefined}
            forbidden={dashboard.activeCampaigns.status === "forbidden"}
          />
          <StatCard
            label="Leads (30 dias)"
            value={
              dashboard.leadsLast30Days.status === "ok"
                ? numberFormatter.format(dashboard.leadsLast30Days.data)
                : undefined
            }
            forbidden={dashboard.leadsLast30Days.status === "forbidden"}
          />
          <StatCard
            label="Chamados abertos"
            value={dashboard.openTickets.status === "ok" ? numberFormatter.format(dashboard.openTickets.data) : undefined}
            forbidden={dashboard.openTickets.status === "forbidden"}
          />
        </div>
      )}
    </div>
  );
}
