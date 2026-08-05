import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/layout/LogoutButton";
import { getRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");
  if (ctx.kind !== "CLIENT") redirect("/admin");

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const organization = ctx.memberships.find((membership) => membership.organizationId === organizationId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="font-[family-name:var(--font-display)] text-base font-semibold">
          RZRT <span className="text-blue-light">Digital</span>
          {organization && <span className="text-text-secondary"> · {organization.organizationName}</span>}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">{ctx.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
