import type { ReportStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type ReportWriteInput = {
  title: string;
  description?: string;
  periodStart: Date;
  periodEnd: Date;
  content: string;
};

/**
 * CLIENT nunca vê `DRAFT`/`REVIEW`/`ARCHIVED` — só `PUBLISHED`
 * (docs/PROMPTS.md Etapa 5, checklist "relatório DRAFT visível ao
 * cliente"). `statusFilter` é decidido pelo service a partir do `ctx`,
 * nunca por um parâmetro vindo do request.
 */
export function listReports(
  organizationId: string,
  statusFilter: ReportStatus[] | undefined,
  params: { skip: number; take: number },
) {
  return db.report.findMany({
    where: { organizationId, ...(statusFilter ? { status: { in: statusFilter } } : {}) },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countReports(organizationId: string, statusFilter: ReportStatus[] | undefined) {
  return db.report.count({
    where: { organizationId, ...(statusFilter ? { status: { in: statusFilter } } : {}) },
  });
}

export function createReport(organizationId: string, createdById: string, input: ReportWriteInput) {
  return db.report.create({
    data: {
      organizationId,
      createdById,
      title: input.title,
      description: input.description ?? null,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      content: { text: input.content },
    },
  });
}

export function findReportById(organizationId: string, reportId: string) {
  return db.report.findFirst({ where: { id: reportId, organizationId } });
}

export function updateReportStatus(organizationId: string, reportId: string, status: ReportStatus) {
  return db.report.update({
    where: { id: reportId, organizationId },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : undefined },
  });
}

export function softDeleteReport(organizationId: string, reportId: string) {
  return db.report.update({ where: { id: reportId, organizationId }, data: { deletedAt: new Date() } });
}
