import type { TicketCategory, TicketStatus } from "@prisma/client";
import type { ProjectPriority } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertOrganizationAccess, hasPermission, requirePermission } from "@/lib/permissions";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  countTickets,
  createTicket as createTicketRow,
  createTicketMessage,
  findTicketById,
  listTickets as listTicketsRows,
  updateTicketStatus,
} from "@/modules/tickets/repositories/ticket.repository";

const PAGE_SIZE = 20;

export async function listTickets(ctx: RequestContext, organizationId: string, page: number) {
  requirePermission(ctx, "tickets.read");
  assertOrganizationAccess(ctx, organizationId);

  const [items, total] = await Promise.all([
    listTicketsRows(organizationId, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countTickets(organizationId),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/**
 * TicketMessage.isInternal nunca é visível ao CLIENT (docs/PROMPTS.md
 * Etapa 5, checklist) — filtrado aqui, não confiando na UI para escondê-lo.
 */
export async function getTicket(ctx: RequestContext, organizationId: string, ticketId: string) {
  requirePermission(ctx, "tickets.read");
  assertOrganizationAccess(ctx, organizationId);

  const ticket = await findTicketById(organizationId, ticketId);
  if (!ticket || ticket.deletedAt) throw new NotFoundError("Chamado não encontrado.");

  if (ctx.kind === "CLIENT") {
    return { ...ticket, messages: ticket.messages.filter((message) => !message.isInternal) };
  }

  return ticket;
}

export async function createTicket(
  ctx: RequestContext,
  organizationId: string,
  input: { subject: string; description: string; category: TicketCategory; priority: ProjectPriority },
) {
  requirePermission(ctx, "tickets.create");
  assertOrganizationAccess(ctx, organizationId);

  const ticket = await createTicketRow(organizationId, ctx.userId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "ticket.create",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { subject: ticket.subject },
  });

  return ticket;
}

async function assertTicketInOrganization(organizationId: string, ticketId: string) {
  const ticket = await findTicketById(organizationId, ticketId);
  if (!ticket || ticket.deletedAt) throw new NotFoundError("Chamado não encontrado.");
  return ticket;
}

export async function setTicketStatus(
  ctx: RequestContext,
  organizationId: string,
  ticketId: string,
  status: TicketStatus,
) {
  requirePermission(ctx, "tickets.manage");
  assertOrganizationAccess(ctx, organizationId);
  const current = await assertTicketInOrganization(organizationId, ticketId);
  if (current.status === status) return current;

  const ticket = await updateTicketStatus(organizationId, ticketId, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "ticket.status_change",
    entityType: "Ticket",
    entityId: ticketId,
    metadata: { from: current.status, to: status },
  });

  return ticket;
}

export async function addTicketMessage(
  ctx: RequestContext,
  organizationId: string,
  ticketId: string,
  message: string,
  isInternal: boolean,
) {
  requirePermission(ctx, "tickets.respond");
  assertOrganizationAccess(ctx, organizationId);
  await assertTicketInOrganization(organizationId, ticketId);

  if (isInternal && !hasPermission(ctx, "tickets.internalNotes")) throw new ForbiddenError();

  const created = await createTicketMessage(ticketId, ctx.userId, message, isInternal);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "ticket.message_add",
    entityType: "TicketMessage",
    entityId: created.id,
    metadata: { ticketId, isInternal: created.isInternal },
  });

  return created;
}
