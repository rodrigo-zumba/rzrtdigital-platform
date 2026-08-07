import type { ProjectPriority, TicketCategory, TicketStatus } from "@prisma/client";

import { db } from "@/lib/db";

const OPEN_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"];

export function listTickets(organizationId: string, params: { skip: number; take: number }) {
  return db.ticket.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countTickets(organizationId: string) {
  return db.ticket.count({ where: { organizationId } });
}

async function nextTicketNumber(organizationId: string) {
  const last = await db.ticket.findFirst({
    where: { organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

export async function createTicket(
  organizationId: string,
  createdById: string,
  input: { subject: string; description: string; category: TicketCategory; priority: ProjectPriority },
) {
  const number = await nextTicketNumber(organizationId);
  return db.ticket.create({
    data: {
      organizationId,
      createdById,
      number,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority,
    },
  });
}

export function findTicketById(organizationId: string, ticketId: string) {
  return db.ticket.findFirst({
    where: { id: ticketId, organizationId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
    },
  });
}

export function updateTicketStatus(organizationId: string, ticketId: string, status: TicketStatus) {
  return db.ticket.update({
    where: { id: ticketId, organizationId },
    data: { status, closedAt: status === "CLOSED" || status === "RESOLVED" ? new Date() : null },
  });
}

export function createTicketMessage(ticketId: string, authorId: string, message: string, isInternal: boolean) {
  return db.ticketMessage.create({ data: { ticketId, authorId, message, isInternal } });
}

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
