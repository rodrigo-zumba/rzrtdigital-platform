"use client";

import type { CampaignStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { setCampaignStatusAction } from "@/modules/campaigns/actions/set-campaign-status.action";

const NEXT_STATUS_OPTIONS: Record<CampaignStatus, { status: CampaignStatus; label: string }[]> = {
  PLANNING: [{ status: "ACTIVE", label: "Ativar" }],
  ACTIVE: [{ status: "PAUSED", label: "Pausar" }, { status: "COMPLETED", label: "Concluir" }],
  PAUSED: [{ status: "ACTIVE", label: "Retomar" }, { status: "COMPLETED", label: "Concluir" }],
  COMPLETED: [{ status: "ACTIVE", label: "Reabrir" }],
};

export function CampaignStatusActions({
  organizationId,
  campaignId,
  status,
}: {
  organizationId: string;
  campaignId: string;
  status: CampaignStatus;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setCampaignStatusAction, null);
  const options = NEXT_STATUS_OPTIONS[status];

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="campaignId" value={campaignId} />
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

function StatusButton({ status, label }: { status: CampaignStatus; label: string }) {
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
