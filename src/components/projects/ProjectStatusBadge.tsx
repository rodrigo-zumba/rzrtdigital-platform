import type { ProjectStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: "Planejamento",
  IN_PROGRESS: "Em andamento",
  ON_HOLD: "Em pausa",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const STATUS_STYLE: Record<ProjectStatus, string> = {
  PLANNING: "bg-blue-light/10 text-blue-light",
  IN_PROGRESS: "bg-success/10 text-success",
  ON_HOLD: "bg-warning/10 text-warning",
  COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-danger/10 text-danger",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
