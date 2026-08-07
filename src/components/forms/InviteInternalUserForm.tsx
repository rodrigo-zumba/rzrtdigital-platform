"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { inviteInternalUserAction } from "@/modules/invitations/actions/invite-internal.action";

export function InviteInternalUserForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(inviteInternalUserAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <Input label="E-mail" name="email" type="email" required className="min-w-[220px]" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invite-internal-role" className="text-sm font-medium text-text-secondary">
          Papel
        </label>
        <select
          id="invite-internal-role"
          name="role"
          defaultValue="ANALYST"
          className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
        >
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="ANALYST">Analyst</option>
        </select>
      </div>
      <SubmitButton pendingLabel="Enviando..." className="w-auto">
        Convidar
      </SubmitButton>
      {state && !state.ok && (
        <p role="alert" className="w-full text-sm text-danger">
          {state.error.message}
        </p>
      )}
      {state && state.ok && <p className="w-full text-sm text-success">Convite enviado.</p>}
    </form>
  );
}
