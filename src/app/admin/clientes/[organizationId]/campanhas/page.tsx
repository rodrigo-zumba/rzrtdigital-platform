import type { Metadata } from "next";
import Link from "next/link";

import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { Button } from "@/components/ui/Button";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { listCampaigns } from "@/modules/campaigns/services/campaign.service";

export const metadata: Metadata = { title: "Campanhas" };

export default async function AdminCampanhasPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { organizationId } = await params;
  const { page } = await searchParams;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;

  const ctx = await requireRequestContext();

  let result;
  try {
    result = await listCampaigns(ctx, organizationId, pageNumber);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Campanhas</h1>
          <p className="mt-1 text-sm text-text-secondary">{result.total} campanha(s).</p>
        </div>
        {hasPermission(ctx, "campaigns.create") && (
          <Link href={`/admin/clientes/${organizationId}/campanhas/novo`}>
            <Button>Nova campanha</Button>
          </Link>
        )}
      </div>

      <CampaignsTable campaigns={result.items} basePath={`/admin/clientes/${organizationId}/campanhas`} />

      <Pagination page={result.page} pageCount={result.pageCount} basePath={`/admin/clientes/${organizationId}/campanhas`} searchParams={{}} />
    </div>
  );
}
