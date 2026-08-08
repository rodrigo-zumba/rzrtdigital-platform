import type { ReportStatus } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertOrganizationAccess, requirePermission } from "@/lib/permissions";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  countReports,
  createReport as createReportRow,
  findReportById,
  listReports as listReportsRows,
  softDeleteReport,
  updateReportStatus,
  type ReportWriteInput,
} from "@/modules/reports/repositories/report.repository";

const PAGE_SIZE = 20;

/** CLIENT só vê PUBLISHED — nunca DRAFT/REVIEW/ARCHIVED (Etapa 5, checklist). */
function statusFilterFor(ctx: RequestContext): ReportStatus[] | undefined {
  return ctx.kind === "CLIENT" ? ["PUBLISHED"] : undefined;
}

export async function listReports(ctx: RequestContext, organizationId: string, page: number) {
  requirePermission(ctx, "reports.read", organizationId);
  assertOrganizationAccess(ctx, organizationId);

  const statusFilter = statusFilterFor(ctx);
  const [items, total] = await Promise.all([
    listReportsRows(organizationId, statusFilter, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countReports(organizationId, statusFilter),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getReport(ctx: RequestContext, organizationId: string, reportId: string) {
  requirePermission(ctx, "reports.read", organizationId);
  assertOrganizationAccess(ctx, organizationId);

  const report = await findReportById(organizationId, reportId);
  if (!report || report.deletedAt) throw new NotFoundError("Relatório não encontrado.");
  if (ctx.kind === "CLIENT" && report.status !== "PUBLISHED") throw new ForbiddenError();

  return report;
}

export async function createReport(ctx: RequestContext, organizationId: string, input: ReportWriteInput) {
  requirePermission(ctx, "reports.create", organizationId);
  assertOrganizationAccess(ctx, organizationId);

  const report = await createReportRow(organizationId, ctx.userId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "report.create",
    entityType: "Report",
    entityId: report.id,
    metadata: { title: report.title },
  });

  return report;
}

async function assertReportInOrganization(organizationId: string, reportId: string) {
  const report = await findReportById(organizationId, reportId);
  if (!report || report.deletedAt) throw new NotFoundError("Relatório não encontrado.");
  return report;
}

export async function setReportStatus(
  ctx: RequestContext,
  organizationId: string,
  reportId: string,
  status: ReportStatus,
) {
  const permission = status === "PUBLISHED" ? "reports.publish" : "reports.create";
  requirePermission(ctx, permission, organizationId);
  assertOrganizationAccess(ctx, organizationId);
  const current = await assertReportInOrganization(organizationId, reportId);
  if (current.status === status) return current;

  const report = await updateReportStatus(organizationId, reportId, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "report.status_change",
    entityType: "Report",
    entityId: reportId,
    metadata: { from: current.status, to: status },
  });

  return report;
}

export async function archiveReport(ctx: RequestContext, organizationId: string, reportId: string) {
  requirePermission(ctx, "reports.archive", organizationId);
  assertOrganizationAccess(ctx, organizationId);
  await assertReportInOrganization(organizationId, reportId);

  await softDeleteReport(organizationId, reportId);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "report.archive",
    entityType: "Report",
    entityId: reportId,
    metadata: {},
  });
}
