import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportStatusActions } from "@/components/reports/ReportStatusActions";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { requireRequestContext } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { getReport } from "@/modules/reports/services/report.service";

export const metadata: Metadata = { title: "Relatório" };

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function reportText(content: unknown): string {
  if (typeof content === "object" && content !== null && "text" in content) {
    const value = (content as { text: unknown }).text;
    if (typeof value === "string") return value;
  }
  return "";
}

export default async function AdminRelatorioDetalhePage({
  params,
}: {
  params: Promise<{ organizationId: string; reportId: string }>;
}) {
  const { organizationId, reportId } = await params;
  const ctx = await requireRequestContext();

  let report;
  try {
    report = await getReport(ctx, organizationId, reportId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const canManage = hasPermission(ctx, "reports.create") || hasPermission(ctx, "reports.publish");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">{report.title}</h1>
        <ReportStatusBadge status={report.status} />
      </div>

      <p className="text-sm text-text-secondary">
        Período: {dateFormatter.format(report.periodStart)} — {dateFormatter.format(report.periodEnd)}
      </p>

      {canManage && (
        <ReportStatusActions organizationId={organizationId} reportId={reportId} status={report.status} />
      )}

      <div className="surface-card whitespace-pre-wrap p-5 text-sm text-text-primary">{reportText(report.content)}</div>
    </div>
  );
}
