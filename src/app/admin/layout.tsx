import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { getRequestContext } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getNotificationsPreview } from "@/modules/notifications/services/notification.service";

const BREADCRUMB_LABELS: Record<string, string> = {
  clientes: "Clientes",
  novo: "Novo cliente",
  usuarios: "Usuários",
  logs: "Logs",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");
  if (ctx.kind !== "INTERNAL") redirect("/portal");

  const { items, unreadCount } = await getNotificationsPreview(ctx);

  const navItems = [
    { href: "/admin", label: "Início" },
    ...(hasPermission(ctx, "organizations.read") ? [{ href: "/admin/clientes", label: "Clientes" }] : []),
    ...(hasPermission(ctx, "users.read") ? [{ href: "/admin/usuarios", label: "Usuários" }] : []),
    ...(hasPermission(ctx, "auditLogs.read") ? [{ href: "/admin/logs", label: "Logs" }] : []),
  ];

  return (
    <AppShell
      brand={
        <p className="font-[family-name:var(--font-display)] text-base font-semibold">
          RZRT <span className="text-blue-light">Digital</span> · Admin
        </p>
      }
      navItems={navItems}
      notifications={<NotificationsMenu items={items} unreadCount={unreadCount} />}
      userMenu={<UserMenu name={ctx.name} email={ctx.email} />}
      breadcrumbs={<Breadcrumbs root="/admin" rootLabel="Admin" labels={BREADCRUMB_LABELS} />}
    >
      {children}
    </AppShell>
  );
}
