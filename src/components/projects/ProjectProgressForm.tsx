"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { setProjectProgressAction } from "@/modules/projects/actions/set-project-progress.action";

export function ProjectProgressForm({
  organizationId,
  projectId,
  progress,
}: {
  organizationId: string;
  projectId: string;
  progress: number;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setProjectProgressAction, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="projectId" value={projectId} />
      <label htmlFor="progress" className="text-sm text-text-secondary">
        Progresso
      </label>
      <input
        id="progress"
        name="progress"
        type="number"
        min={0}
        max={100}
        defaultValue={progress}
        className="min-h-[36px] w-20 rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-2 text-sm text-text-primary outline-none focus-visible:border-blue-light"
      />
      <span className="text-sm text-text-secondary">%</span>
      <SaveButton />
      {state && !state.ok && <span className="text-xs text-danger">{state.error.message}</span>}
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover disabled:opacity-60"
    >
      Salvar
    </button>
  );
}
