import type { OrganizationStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<OrganizationStatus, string> = {
  ONBOARDING: "Onboarding",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  ARCHIVED: "Arquivado",
};

const STATUS_STYLE: Record<OrganizationStatus, string> = {
  ONBOARDING: "bg-blue-light/10 text-blue-light",
  ACTIVE: "bg-success/10 text-success",
  SUSPENDED: "bg-warning/10 text-warning",
  ARCHIVED: "bg-danger/10 text-danger",
};

export function OrganizationStatusBadge({ status }: { status: OrganizationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
