import type { TicketStatus } from "@prisma/client";

import { db } from "@/lib/db";

const OPEN_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"];

/**
 * Módulo de chamados (páginas, CRUD) é Fase 4. Este repository só tem a
 * contagem que o dashboard (Etapa 4) precisa.
 */
export function countOpenTickets(organizationIds?: string[]) {
  return db.ticket.count({
    where: {
      organizationId: organizationIds ? { in: organizationIds } : undefined,
      status: { in: OPEN_STATUSES },
    },
  });
}
