"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { acceptInvitationAction } from "@/modules/auth/actions/accept-invitation.action";

export function AcceptInvitationForm({ token, email }: { token: string; email: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(acceptInvitationAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <Input label="E-mail" value={email} readOnly disabled />
      <Input label="Nome completo" name="name" autoComplete="name" required />
      <Input
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        required
      />
      <Input
        label="Confirme a senha"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={12}
        required
      />

      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}

      <SubmitButton pendingLabel="Criando conta...">Aceitar convite</SubmitButton>
    </form>
  );
}
