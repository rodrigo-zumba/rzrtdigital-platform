"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "CRIATIVOS", label: "Criativos" },
  { value: "ESTRATEGIA_DIGITAL", label: "Estratégia digital" },
  { value: "FUNIS_DE_VENDAS", label: "Funis de vendas" },
  { value: "INTELIGENCIA_ARTIFICIAL", label: "Inteligência artificial" },
  { value: "SITES_E_LANDING_PAGES", label: "Sites e landing pages" },
  { value: "TRAFEGO_PAGO", label: "Tráfego pago" },
  { value: "OUTRO", label: "Outro" },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

type ProjectFormValues = {
  name: string;
  description?: string;
  type: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
};

export function ProjectForm({
  defaultValues,
  hiddenFields,
  onSubmitAction,
  submitLabel,
}: {
  defaultValues?: Partial<ProjectFormValues>;
  hiddenFields?: Record<string, string>;
  onSubmitAction: (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(onSubmitAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {Object.entries(hiddenFields ?? {}).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Nome do projeto" name="name" defaultValue={defaultValues?.name} required className="sm:col-span-2" />

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium text-text-secondary">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description}
            rows={3}
            className="rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium text-text-secondary">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={defaultValues?.type ?? "OUTRO"}
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          >
            {TYPE_OPTIONS.map((option) => (
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
            defaultValue={defaultValues?.priority ?? "MEDIUM"}
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Input label="Início" name="startDate" type="date" defaultValue={defaultValues?.startDate} />
        <Input label="Prazo" name="dueDate" type="date" defaultValue={defaultValues?.dueDate} />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue px-5 py-2.5 text-sm font-semibold text-text-primary shadow-[var(--shadow-glow)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}
