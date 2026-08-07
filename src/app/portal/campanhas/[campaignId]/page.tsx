import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { MetricsSection } from "@/components/campaigns/MetricsSection";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { NotFoundError } from "@/lib/errors";
import { getCampaign } from "@/modules/campaigns/services/campaign.service";

export const metadata: Metadata = { title: "Campanha" };

export default async function PortalCampanhaDetalhePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  let campaign;
  try {
    campaign = await getCampaign(ctx, organizationId, campaignId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">{campaign.name}</h1>
        <CampaignStatusBadge status={campaign.status} />
      </div>

      <MetricsSection organizationId={organizationId} campaignId={campaignId} metrics={campaign.metrics} canWrite={false} />
    </div>
  );
}
