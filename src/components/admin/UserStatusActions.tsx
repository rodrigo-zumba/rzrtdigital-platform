"use client";

import type { UserStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { setUserStatusAction } from "@/modules/users/actions/set-user-status.action";

export function UserStatusActions({ userId, status }: { userId: string; status: UserStatus }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setUserStatusAction, null);
  const nextStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={nextStatus} />
      <StatusButton label={status === "ACTIVE" ? "Suspender" : "Reativar"} danger={status === "ACTIVE"} />
      {state && !state.ok && (
        <span className="text-xs text-danger" role="alert">
          {state.error.message}
        </span>
      )}
    </form>
  );
}

function StatusButton({ label, danger }: { label: string; danger: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        danger
          ? "rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-1 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-60"
          : "rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-3 py-1 text-xs font-medium text-text-primary hover:bg-surface-hover disabled:opacity-60"
      }
    >
      {label}
    </button>
  );
}
