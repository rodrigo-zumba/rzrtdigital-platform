"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { addTicketMessageAction } from "@/modules/tickets/actions/add-ticket-message.action";

type Message = {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
  author: { name: string };
};

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});

export function TicketMessagesSection({
  organizationId,
  ticketId,
  messages,
  canRespond,
  canWriteInternalNotes,
}: {
  organizationId: string;
  ticketId: string;
  messages: Message[];
  canRespond: boolean;
  canWriteInternalNotes: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">Mensagens</h2>

      {messages.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhuma mensagem ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`surface-card p-4 ${message.isInternal ? "border border-warning/40" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">{message.author.name}</p>
                <div className="flex items-center gap-2">
                  {message.isInternal && <span className="text-xs text-warning">Nota interna</span>}
                  <span className="text-xs text-text-secondary">{dateTimeFormatter.format(message.createdAt)}</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{message.message}</p>
            </li>
          ))}
        </ul>
      )}

      {canRespond && (
        <AddMessageForm organizationId={organizationId} ticketId={ticketId} canWriteInternalNotes={canWriteInternalNotes} />
      )}
    </section>
  );
}

function AddMessageForm({
  organizationId,
  ticketId,
  canWriteInternalNotes,
}: {
  organizationId: string;
  ticketId: string;
  canWriteInternalNotes: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(addTicketMessageAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="message"
        rows={3}
        required
        placeholder="Escreva uma resposta..."
        className="rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
      />
      <div className="flex items-center justify-between">
        {canWriteInternalNotes ? (
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" name="isInternal" value="true" />
            Nota interna (não visível ao cliente)
          </label>
        ) : (
          <span />
        )}
        <SendButton />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[40px] rounded-[var(--radius-sm)] bg-blue px-4 text-sm font-semibold text-text-primary hover:brightness-110 disabled:opacity-60"
    >
      Enviar
    </button>
  );
}
