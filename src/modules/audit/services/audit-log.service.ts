import type { RequestContext } from "@/lib/auth/types";
import { requirePermission } from "@/lib/permissions";
import { countAuditLogs, listAuditLogs as listAuditLogsRows } from "@/modules/audit/repositories/audit-log.repository";

const PAGE_SIZE = 30;

/** `auditLogs.read` é exclusivo de SUPER_ADMIN (docs/ESPECIFICACAO.md §3). */
export async function listAuditLogs(
  ctx: RequestContext,
  params: { organizationId?: string; action?: string; page: number },
) {
  requirePermission(ctx, "auditLogs.read");

  const filters = { organizationId: params.organizationId, action: params.action };
  const [items, total] = await Promise.all([
    listAuditLogsRows(filters, { skip: (params.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countAuditLogs(filters),
  ]);

  return { items, total, page: params.page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
