"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { createReportAction } from "@/modules/reports/actions/create-report.action";

export function ReportForm({ organizationId }: { organizationId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createReportAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <Input label="Título" name="title" required />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Início do período" name="periodStart" type="date" required />
        <Input label="Fim do período" name="periodEnd" type="date" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium text-text-secondary">
          Conteúdo
        </label>
        <textarea
          id="content"
          name="content"
          rows={8}
          required
          className="rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
        />
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
      {pending ? "Criando..." : "Criar relatório (rascunho)"}
    </button>
  );
}
