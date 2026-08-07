"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { createTicketAction } from "@/modules/tickets/actions/create-ticket.action";

const CATEGORY_OPTIONS = [
  { value: "TECHNICAL", label: "Técnico" },
  { value: "BILLING", label: "Financeiro" },
  { value: "PROJECT", label: "Projeto" },
  { value: "CAMPAIGN", label: "Campanha" },
  { value: "GENERAL", label: "Geral" },
  { value: "OTHER", label: "Outro" },
];

export function TicketForm({ organizationId }: { organizationId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createTicketAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <Input label="Assunto" name="subject" required />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-text-secondary">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          className="rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-text-secondary">
            Categoria
          </label>
          <select
            id="category"
            name="category"
            defaultValue="GENERAL"
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="priority" className="text-sm font-medium text-text-secondary">
            Prioridade
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="MEDIUM"
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          >
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue px-5 py-2.5 text-sm font-semibold text-text-primary shadow-[var(--shadow-glow)] hover:brightness-110 disabled:opacity-60"
    >
      {pending ? "Abrindo..." : "Abrir chamado"}
    </button>
  );
}
