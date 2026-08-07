"use client";

import type { TicketStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { setTicketStatusAction } from "@/modules/tickets/actions/set-ticket-status.action";

const NEXT_STATUS_OPTIONS: Record<TicketStatus, { status: TicketStatus; label: string }[]> = {
  OPEN: [{ status: "IN_PROGRESS", label: "Assumir" }, { status: "WAITING_CLIENT", label: "Aguardar cliente" }],
  IN_PROGRESS: [
    { status: "WAITING_CLIENT", label: "Aguardar cliente" },
    { status: "RESOLVED", label: "Resolver" },
  ],
  WAITING_CLIENT: [{ status: "IN_PROGRESS", label: "Retomar" }, { status: "RESOLVED", label: "Resolver" }],
  RESOLVED: [{ status: "CLOSED", label: "Fechar" }, { status: "IN_PROGRESS", label: "Reabrir" }],
  CLOSED: [{ status: "IN_PROGRESS", label: "Reabrir" }],
};

export function TicketStatusActions({
  organizationId,
  ticketId,
  status,
}: {
  organizationId: string;
  ticketId: string;
  status: TicketStatus;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setTicketStatusAction, null);
  const options = NEXT_STATUS_OPTIONS[status];

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="ticketId" value={ticketId} />
      {options.map((option) => (
        <StatusButton key={option.status} status={option.status} label={option.label} />
      ))}
      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}
    </form>
  );
}

function StatusButton({ status, label }: { status: TicketStatus; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={pending}
      className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-blue-light/50 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
