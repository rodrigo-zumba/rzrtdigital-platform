"use client";

import type { InternalRole } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { updateInternalRoleAction } from "@/modules/users/actions/update-internal-role.action";

const ROLE_OPTIONS: { value: InternalRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "ANALYST", label: "Analyst" },
];

export function InternalRoleForm({ userId, currentRole }: { userId: string; currentRole: InternalRole }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(updateInternalRoleAction, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <RoleSelect currentRole={currentRole} />
      {state && !state.ok && (
        <span className="text-xs text-danger" role="alert">
          {state.error.message}
        </span>
      )}
    </form>
  );
}

function RoleSelect({ currentRole }: { currentRole: InternalRole }) {
  const { pending } = useFormStatus();

  return (
    <select
      name="role"
      defaultValue={currentRole}
      disabled={pending}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="min-h-[36px] rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-2 py-1 text-xs text-text-primary outline-none focus-visible:border-blue-light disabled:opacity-60"
    >
      {ROLE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
