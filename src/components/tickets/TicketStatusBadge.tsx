import type { TicketStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  WAITING_CLIENT: "Aguardando cliente",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: "bg-blue-light/10 text-blue-light",
  IN_PROGRESS: "bg-warning/10 text-warning",
  WAITING_CLIENT: "bg-warning/10 text-warning",
  RESOLVED: "bg-success/10 text-success",
  CLOSED: "bg-text-secondary/10 text-text-secondary",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
