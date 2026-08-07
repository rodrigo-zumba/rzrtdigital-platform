import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ReportsTable } from "@/components/reports/ReportsTable";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/errors";
import { listReports } from "@/modules/reports/services/report.service";

export const metadata: Metadata = { title: "Relatórios" };

export default async function PortalRelatoriosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const { page } = await searchParams;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;

  let result;
  try {
    result = await listReports(ctx, organizationId, pageNumber);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Relatórios</h1>
        <p className="mt-1 text-sm text-text-secondary">{result.total} relatório(s) publicado(s).</p>
      </div>

      <ReportsTable reports={result.items} basePath="/portal/relatorios" />

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/portal/relatorios" searchParams={{}} />
    </div>
  );
}
