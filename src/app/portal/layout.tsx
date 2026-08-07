import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { OrganizationSwitcher } from "@/components/layout/OrganizationSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { getRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { getNotificationsPreview } from "@/modules/notifications/services/notification.service";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");
  if (ctx.kind !== "CLIENT") redirect("/admin");

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const organization = ctx.memberships.find((membership) => membership.organizationId === organizationId);
  if (!organization) redirect("/selecionar-workspace");

  const { items, unreadCount } = await getNotificationsPreview(ctx);

  return (
    <AppShell
      brand={
        <p className="font-[family-name:var(--font-display)] text-base font-semibold">
          RZRT <span className="text-blue-light">Digital</span>
        </p>
      }
      navItems={[{ href: "/portal", label: "Início" }]}
      orgSwitcher={<OrganizationSwitcher current={organization} memberships={ctx.memberships} />}
      notifications={<NotificationsMenu items={items} unreadCount={unreadCount} />}
      userMenu={<UserMenu name={ctx.name} email={ctx.email} />}
      breadcrumbs={<Breadcrumbs root="/portal" rootLabel="Portal" labels={{}} />}
    >
      {children}
    </AppShell>
  );
}
