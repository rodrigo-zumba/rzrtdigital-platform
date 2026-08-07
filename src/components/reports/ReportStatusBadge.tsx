import type { ReportStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ReportStatus, string> = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const STATUS_STYLE: Record<ReportStatus, string> = {
  DRAFT: "bg-text-secondary/10 text-text-secondary",
  REVIEW: "bg-warning/10 text-warning",
  PUBLISHED: "bg-success/10 text-success",
  ARCHIVED: "bg-danger/10 text-danger",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
