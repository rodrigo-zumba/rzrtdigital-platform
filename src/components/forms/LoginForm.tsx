"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { loginAction } from "@/modules/auth/actions/login.action";

export function LoginForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Input label="E-mail" name="email" type="email" autoComplete="email" required />
      <Input label="Senha" name="password" type="password" autoComplete="current-password" required />

      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}

      <SubmitButton pendingLabel="Entrando...">Entrar</SubmitButton>

      <Link href="/esqueci-minha-senha" className="text-center text-sm text-text-secondary hover:text-blue-light">
        Esqueci minha senha
      </Link>
    </form>
  );
}
