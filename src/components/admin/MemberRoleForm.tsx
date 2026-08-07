"use client";

import type { MemberRole } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { updateMemberRoleAction } from "@/modules/users/actions/update-member-role.action";

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "CLIENT_ADMIN", label: "Admin do cliente" },
  { value: "CLIENT_MEMBER", label: "Membro" },
  { value: "CLIENT_VIEWER", label: "Visualizador" },
];

export function MemberRoleForm({
  organizationId,
  userId,
  currentRole,
}: {
  organizationId: string;
  userId: string;
  currentRole: MemberRole;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(updateMemberRoleAction, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
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

function RoleSelect({ currentRole }: { currentRole: MemberRole }) {
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
