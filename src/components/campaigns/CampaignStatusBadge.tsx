import type { CampaignStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CampaignStatus, string> = {
  PLANNING: "Planejamento",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
};

const STATUS_STYLE: Record<CampaignStatus, string> = {
  PLANNING: "bg-blue-light/10 text-blue-light",
  ACTIVE: "bg-success/10 text-success",
  PAUSED: "bg-warning/10 text-warning",
  COMPLETED: "bg-text-secondary/10 text-text-secondary",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
