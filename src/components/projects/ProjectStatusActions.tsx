"use client";

import type { ProjectStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { setProjectStatusAction } from "@/modules/projects/actions/set-project-status.action";

const NEXT_STATUS_OPTIONS: Record<ProjectStatus, { status: ProjectStatus; label: string }[]> = {
  PLANNING: [{ status: "IN_PROGRESS", label: "Iniciar" }, { status: "CANCELLED", label: "Cancelar" }],
  IN_PROGRESS: [
    { status: "ON_HOLD", label: "Pausar" },
    { status: "COMPLETED", label: "Concluir" },
    { status: "CANCELLED", label: "Cancelar" },
  ],
  ON_HOLD: [{ status: "IN_PROGRESS", label: "Retomar" }, { status: "CANCELLED", label: "Cancelar" }],
  COMPLETED: [{ status: "IN_PROGRESS", label: "Reabrir" }],
  CANCELLED: [{ status: "PLANNING", label: "Reabrir" }],
};

export function ProjectStatusActions({
  organizationId,
  projectId,
  status,
}: {
  organizationId: string;
  projectId: string;
  status: ProjectStatus;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setProjectStatusAction, null);
  const options = NEXT_STATUS_OPTIONS[status];

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="projectId" value={projectId} />
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

function StatusButton({ status, label }: { status: ProjectStatus; label: string }) {
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
