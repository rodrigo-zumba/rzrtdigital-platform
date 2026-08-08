import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TicketsTable } from "@/components/tickets/TicketsTable";
import { Button } from "@/components/ui/Button";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { listTickets } from "@/modules/tickets/services/ticket.service";

export const metadata: Metadata = { title: "Chamados" };

export default async function PortalChamadosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const { page } = await searchParams;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;

  let result;
  try {
    result = await listTickets(ctx, organizationId, pageNumber);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Chamados</h1>
          <p className="mt-1 text-sm text-text-secondary">{result.total} chamado(s).</p>
        </div>
        {hasPermission(ctx, "tickets.create", organizationId) && (
          <Link href="/portal/chamados/novo">
            <Button>Novo chamado</Button>
          </Link>
        )}
      </div>

      <TicketsTable tickets={result.items} basePath="/portal/chamados" />

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/portal/chamados" searchParams={{}} />
    </div>
  );
}
