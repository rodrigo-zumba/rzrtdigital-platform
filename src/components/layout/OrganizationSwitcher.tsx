import { selectWorkspaceAction } from "@/modules/auth/actions/select-workspace.action";

type Membership = { organizationId: string; organizationName: string; role: string };

export function OrganizationSwitcher({
  current,
  memberships,
}: {
  current: Membership;
  memberships: readonly Membership[];
}) {
  if (memberships.length <= 1) {
    return <p className="truncate text-sm text-text-secondary">{current.organizationName}</p>;
  }

  return (
    <details className="group relative">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 rounded-[var(--radius-md)] px-2 text-sm text-text-primary outline-none hover:text-blue-light focus-visible:ring-2 focus-visible:ring-blue-light">
        <span className="max-w-[12rem] truncate">{current.organizationName}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0" aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="absolute left-0 z-20 mt-2 w-64 rounded-[var(--radius-md)] border border-border bg-surface p-2 shadow-[var(--shadow-soft)]">
        {memberships.map((membership) => (
          <form key={membership.organizationId} action={selectWorkspaceAction}>
            <input type="hidden" name="organizationId" value={membership.organizationId} />
            <button
              type="submit"
              disabled={membership.organizationId === current.organizationId}
              className="flex w-full min-h-[44px] items-center justify-between rounded-[var(--radius-sm)] px-3 text-left text-sm text-text-primary hover:bg-surface-hover disabled:cursor-default disabled:text-blue-light"
            >
              <span className="truncate">{membership.organizationName}</span>
              <span className="shrink-0 text-xs text-text-secondary">{membership.role}</span>
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}
