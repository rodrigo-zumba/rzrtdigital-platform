"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { forgotPasswordAction } from "@/modules/auth/actions/forgot-password.action";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<ActionResult<{ message: string }> | null, FormData>(
    forgotPasswordAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-[var(--radius-md)] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {state.data.message}
        </p>
        <Link href="/login" className="text-center text-sm text-text-secondary hover:text-blue-light">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Input label="E-mail" name="email" type="email" autoComplete="email" required />

      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}

      <SubmitButton pendingLabel="Enviando...">Enviar instruções</SubmitButton>

      <Link href="/login" className="text-center text-sm text-text-secondary hover:text-blue-light">
        Voltar para o login
      </Link>
    </form>
  );
}
