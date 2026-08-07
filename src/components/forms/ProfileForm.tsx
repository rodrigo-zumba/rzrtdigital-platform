"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { updateOwnProfileAction } from "@/modules/users/actions/update-own-profile.action";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(updateOwnProfileAction, null);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <Input label="Nome" name="name" defaultValue={name} required />
      <Input label="E-mail" value={email} readOnly disabled />
      <SubmitButton pendingLabel="Salvando..." className="w-auto">
        Salvar
      </SubmitButton>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}
      {state && state.ok && <p className="text-sm text-success">Perfil atualizado.</p>}
    </form>
  );
}
