import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TicketMessagesSection } from "@/components/tickets/TicketMessagesSection";
import { TicketStatusActions } from "@/components/tickets/TicketStatusActions";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { requireRequestContext } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { getTicket } from "@/modules/tickets/services/ticket.service";

export const metadata: Metadata = { title: "Chamado" };

export default async function AdminChamadoDetalhePage({
  params,
}: {
  params: Promise<{ organizationId: string; ticketId: string }>;
}) {
  const { organizationId, ticketId } = await params;
  const ctx = await requireRequestContext();

  let ticket;
  try {
    ticket = await getTicket(ctx, organizationId, ticketId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const canManage = hasPermission(ctx, "tickets.manage");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">
          #{ticket.number} — {ticket.subject}
        </h1>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <p className="text-sm text-text-secondary">{ticket.description}</p>

      {canManage && <TicketStatusActions organizationId={organizationId} ticketId={ticketId} status={ticket.status} />}

      <TicketMessagesSection
        organizationId={organizationId}
        ticketId={ticketId}
        messages={ticket.messages}
        canRespond={hasPermission(ctx, "tickets.respond")}
        canWriteInternalNotes={hasPermission(ctx, "tickets.internalNotes")}
      />
    </div>
  );
}
