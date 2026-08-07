"use client";

import type { OrganizationStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { changeOrganizationStatusAction } from "@/modules/organizations/actions/change-organization-status.action";

const NEXT_STATUS_OPTIONS: Record<OrganizationStatus, { status: OrganizationStatus; label: string }[]> = {
  ONBOARDING: [{ status: "ACTIVE", label: "Ativar" }],
  ACTIVE: [
    { status: "SUSPENDED", label: "Suspender" },
    { status: "ARCHIVED", label: "Arquivar" },
  ],
  SUSPENDED: [
    { status: "ACTIVE", label: "Reativar" },
    { status: "ARCHIVED", label: "Arquivar" },
  ],
  ARCHIVED: [{ status: "ACTIVE", label: "Reativar" }],
};

export function OrganizationStatusActions({
  organizationId,
  status,
}: {
  organizationId: string;
  status: OrganizationStatus;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(changeOrganizationStatusAction, null);
  const options = NEXT_STATUS_OPTIONS[status];

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
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

function StatusButton({ status, label }: { status: OrganizationStatus; label: string }) {
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
