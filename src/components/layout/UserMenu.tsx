import { LogoutButton } from "@/components/layout/LogoutButton";

export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <details className="group relative">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-[var(--radius-md)] px-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-light">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue/20 text-sm font-semibold text-blue-light">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm text-text-secondary sm:inline">{name}</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-[var(--shadow-soft)]">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        <p className="truncate text-xs text-text-secondary">{email}</p>
        <div className="mt-3 border-t border-border pt-3">
          <LogoutButton />
        </div>
      </div>
    </details>
  );
}
