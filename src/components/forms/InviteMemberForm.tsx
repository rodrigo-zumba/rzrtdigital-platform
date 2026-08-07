"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { inviteMemberAction } from "@/modules/invitations/actions/invite-member.action";

export function InviteMemberForm({ organizationId }: { organizationId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(inviteMemberAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <Input label="E-mail" name="email" type="email" required className="min-w-[220px]" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invite-role" className="text-sm font-medium text-text-secondary">
          Papel
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="CLIENT_MEMBER"
          className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
        >
          <option value="CLIENT_ADMIN">Admin do cliente</option>
          <option value="CLIENT_MEMBER">Membro</option>
          <option value="CLIENT_VIEWER">Visualizador</option>
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
