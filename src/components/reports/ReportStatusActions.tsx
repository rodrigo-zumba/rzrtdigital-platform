"use client";

import type { ReportStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { setReportStatusAction } from "@/modules/reports/actions/set-report-status.action";

const NEXT_STATUS_OPTIONS: Record<ReportStatus, { status: ReportStatus; label: string }[]> = {
  DRAFT: [{ status: "REVIEW", label: "Enviar para revisão" }],
  REVIEW: [{ status: "PUBLISHED", label: "Publicar" }, { status: "DRAFT", label: "Voltar para rascunho" }],
  PUBLISHED: [{ status: "ARCHIVED", label: "Arquivar" }],
  ARCHIVED: [{ status: "DRAFT", label: "Reabrir como rascunho" }],
};

export function ReportStatusActions({
  organizationId,
  reportId,
  status,
}: {
  organizationId: string;
  reportId: string;
  status: ReportStatus;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setReportStatusAction, null);
  const options = NEXT_STATUS_OPTIONS[status];

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="reportId" value={reportId} />
      {options.map((option) => (
        <StatusButton key={option.status} status={option.status} label={option.label} />
      ))}
      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}
    </form>
  );
}

function StatusButton({ status, label }: { status: ReportStatus; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={pending}
      className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-blue-light/50 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
