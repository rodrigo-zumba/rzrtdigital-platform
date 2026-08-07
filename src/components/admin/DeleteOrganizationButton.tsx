"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { deleteOrganizationAction } from "@/modules/organizations/actions/delete-organization.action";

export function DeleteOrganizationButton({ organizationId, organizationName }: { organizationId: string; organizationName: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(deleteOrganizationAction, null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Excluir "${organizationName}"? Esta ação não pode ser desfeita pela UI.`)) {
          event.preventDefault();
        }
      }}
      className="flex flex-col items-start gap-2"
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <DeleteButton />
      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Excluindo..." : "Excluir cliente"}
    </button>
  );
}
