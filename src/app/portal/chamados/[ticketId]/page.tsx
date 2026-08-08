import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { TicketMessagesSection } from "@/components/tickets/TicketMessagesSection";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { getTicket } from "@/modules/tickets/services/ticket.service";

export const metadata: Metadata = { title: "Chamado" };

export default async function PortalChamadoDetalhePage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  let ticket;
  try {
    ticket = await getTicket(ctx, organizationId, ticketId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">
          #{ticket.number} — {ticket.subject}
        </h1>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <p className="text-sm text-text-secondary">{ticket.description}</p>

      <TicketMessagesSection
        organizationId={organizationId}
        ticketId={ticketId}
        messages={ticket.messages}
        canRespond={hasPermission(ctx, "tickets.respond", organizationId)}
        canWriteInternalNotes={false}
      />
    </div>
  );
}
