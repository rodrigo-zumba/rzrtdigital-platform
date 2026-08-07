import type { Metadata } from "next";
import Link from "next/link";

import { ReportsTable } from "@/components/reports/ReportsTable";
import { Button } from "@/components/ui/Button";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { listReports } from "@/modules/reports/services/report.service";

export const metadata: Metadata = { title: "Relatórios" };

export default async function AdminRelatoriosPage({
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
    result = await listReports(ctx, organizationId, pageNumber);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Relatórios</h1>
          <p className="mt-1 text-sm text-text-secondary">{result.total} relatório(s).</p>
        </div>
        {hasPermission(ctx, "reports.create") && (
          <Link href={`/admin/clientes/${organizationId}/relatorios/novo`}>
            <Button>Novo relatório</Button>
          </Link>
        )}
      </div>

      <ReportsTable reports={result.items} basePath={`/admin/clientes/${organizationId}/relatorios`} />

      <Pagination page={result.page} pageCount={result.pageCount} basePath={`/admin/clientes/${organizationId}/relatorios`} searchParams={{}} />
    </div>
  );
}
