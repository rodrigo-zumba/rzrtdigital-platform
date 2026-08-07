import type { Metadata } from "next";

import { CampaignForm } from "@/components/campaigns/CampaignForm";

export const metadata: Metadata = { title: "Nova campanha" };

export default async function NovaCampanhaPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Nova campanha</h1>
      <CampaignForm organizationId={organizationId} />
    </div>
  );
}
