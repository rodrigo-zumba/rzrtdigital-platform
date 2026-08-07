import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CampaignStatusActions } from "@/components/campaigns/CampaignStatusActions";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { MetricsSection } from "@/components/campaigns/MetricsSection";
import { requireRequestContext } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { getCampaign } from "@/modules/campaigns/services/campaign.service";

export const metadata: Metadata = { title: "Campanha" };

export default async function AdminCampanhaDetalhePage({
  params,
}: {
  params: Promise<{ organizationId: string; campaignId: string }>;
}) {
  const { organizationId, campaignId } = await params;
  const ctx = await requireRequestContext();

  let campaign;
  try {
    campaign = await getCampaign(ctx, organizationId, campaignId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const canUpdate = hasPermission(ctx, "campaigns.update");

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">{campaign.name}</h1>
        <CampaignStatusBadge status={campaign.status} />
      </div>

      {canUpdate && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-text-secondary">Status</h2>
          <CampaignStatusActions organizationId={organizationId} campaignId={campaignId} status={campaign.status} />
        </section>
      )}

      <MetricsSection
        organizationId={organizationId}
        campaignId={campaignId}
        metrics={campaign.metrics}
        canWrite={hasPermission(ctx, "metrics.write")}
      />
    </div>
  );
}
