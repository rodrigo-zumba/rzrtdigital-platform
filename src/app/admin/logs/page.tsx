import type { Metadata } from "next";

import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { listAuditLogsSchema } from "@/modules/audit/schemas/audit-log.schemas";
import { listAuditLogs } from "@/modules/audit/services/audit-log.service";

export const metadata: Metadata = { title: "Logs de auditoria" };

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string; action?: string; page?: string }>;
}) {
  const rawParams = await searchParams;
  const parsed = listAuditLogsSchema.safeParse(rawParams);
  const params = parsed.success ? parsed.data : { page: 1 };

  const ctx = await requireRequestContext();

  let result;
  try {
    result = await listAuditLogs(ctx, params);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Logs de auditoria</h1>
        <p className="mt-1 text-sm text-text-secondary">{result.total} registro(s).</p>
      </div>

      {result.items.length === 0 ? (
        <div className="surface-card p-6 text-sm text-text-secondary">Nenhum registro encontrado.</div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border bg-surface/60 text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Entidade</th>
                <th className="px-4 py-3 font-medium">Ator</th>
                <th className="px-4 py-3 font-medium">Organização</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-surface-hover/60">
                  <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                    {dateTimeFormatter.format(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{log.action}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{log.actor?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{log.organization?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/admin/logs"
        searchParams={{ organizationId: params.organizationId, action: params.action }}
      />
    </div>
  );
}
