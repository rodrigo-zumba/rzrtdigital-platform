"use client";

import type { AssignmentType } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { createAssignmentAction } from "@/modules/organizations/actions/create-assignment.action";
import { removeAssignmentAction } from "@/modules/organizations/actions/remove-assignment.action";
import type { listAssignments } from "@/modules/organizations/services/assignment.service";

const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  ACCOUNT_MANAGER: "Gerente de conta",
  ANALYST: "Analista",
  SUPPORT: "Suporte",
};

type Assignments = Awaited<ReturnType<typeof listAssignments>>;

export function AssignmentsSection({
  organizationId,
  assignments,
  assignableUsers,
}: {
  organizationId: string;
  assignments: Assignments["assignments"];
  assignableUsers: Assignments["assignableUsers"];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">Carteira (MANAGER / ANALYST atribuídos)</h2>

      {assignments.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhum usuário interno atribuído a este cliente ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border bg-surface/40 px-4 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{assignment.user.name}</p>
                <p className="text-xs text-text-secondary">
                  {assignment.user.internalProfile?.internalRole} · {ASSIGNMENT_TYPE_LABEL[assignment.assignmentType]}
                </p>
              </div>
              <RemoveAssignmentForm organizationId={organizationId} assignmentId={assignment.id} />
            </li>
          ))}
        </ul>
      )}

      {assignableUsers.length > 0 && (
        <AddAssignmentForm organizationId={organizationId} assignableUsers={assignableUsers} />
      )}
    </section>
  );
}

function AddAssignmentForm({
  organizationId,
  assignableUsers,
}: {
  organizationId: string;
  assignableUsers: Assignments["assignableUsers"];
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createAssignmentAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <select
        name="userId"
        required
        className="min-h-[40px] rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
      >
        <option value="">Selecione um usuário</option>
        {assignableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.internalProfile?.internalRole})
          </option>
        ))}
      </select>
      <select
        name="assignmentType"
        defaultValue="ACCOUNT_MANAGER"
        className="min-h-[40px] rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
      >
        {Object.entries(ASSIGNMENT_TYPE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <AddButton />
      {state && !state.ok && (
        <span className="text-xs text-danger" role="alert">
          {state.error.message}
        </span>
      )}
    </form>
  );
}

function RemoveAssignmentForm({ organizationId, assignmentId }: { organizationId: string; assignmentId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(removeAssignmentAction, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <RemoveButton />
      {state && !state.ok && <span className="text-xs text-danger">{state.error.message}</span>}
    </form>
  );
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[40px] rounded-[var(--radius-sm)] bg-blue px-4 text-sm font-semibold text-text-primary hover:brightness-110 disabled:opacity-60"
    >
      Atribuir
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-60"
    >
      Remover
    </button>
  );
}
