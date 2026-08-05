"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { resetPasswordAction } from "@/modules/auth/actions/reset-password.action";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(resetPasswordAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <Input
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        required
      />
      <Input
        label="Confirme a nova senha"
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

      <SubmitButton pendingLabel="Salvando...">Redefinir senha</SubmitButton>
    </form>
  );
}
