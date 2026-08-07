"use client";

import type { MemberStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { removeMemberAction } from "@/modules/users/actions/remove-member.action";
import { setMemberStatusAction } from "@/modules/users/actions/set-member-status.action";

export function MemberRowActions({
  organizationId,
  userId,
  status,
  userName,
  canSuspend = true,
  canRemove = true,
}: {
  organizationId: string;
  userId: string;
  status: MemberStatus;
  userName: string;
  canSuspend?: boolean;
  canRemove?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {canSuspend && status !== "PENDING" && (
        <StatusForm organizationId={organizationId} userId={userId} status={status} />
      )}
      {canRemove && <RemoveForm organizationId={organizationId} userId={userId} userName={userName} />}
    </div>
  );
}

function StatusForm({
  organizationId,
  userId,
  status,
}: {
  organizationId: string;
  userId: string;
  status: MemberStatus;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setMemberStatusAction, null);
  const nextStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={nextStatus} />
      <SubmitButton label={status === "ACTIVE" ? "Suspender" : "Reativar"} />
      {state && !state.ok && <span className="text-xs text-danger">{state.error.message}</span>}
    </form>
  );
}

function RemoveForm({
  organizationId,
  userId,
  userName,
}: {
  organizationId: string;
  userId: string;
  userName: string;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(removeMemberAction, null);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Remover "${userName}" desta organização?`)) event.preventDefault();
      }}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton label="Remover" danger />
      {state && !state.ok && <span className="text-xs text-danger">{state.error.message}</span>}
    </form>
  );
}

function SubmitButton({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        danger
          ? "rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-60"
          : "rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-2 py-1 text-xs font-medium text-text-primary hover:bg-surface-hover disabled:opacity-60"
      }
    >
      {label}
    </button>
  );
}
