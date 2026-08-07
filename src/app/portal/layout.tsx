import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { OrganizationSwitcher } from "@/components/layout/OrganizationSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { getRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { hasPermission } from "@/lib/permissions";
import { getNotificationsPreview } from "@/modules/notifications/services/notification.service";

const BREADCRUMB_LABELS: Record<string, string> = {
  perfil: "Perfil",
  equipe: "Equipe",
  organizacao: "Organização",
  onboarding: "Onboarding",
  notificacoes: "Notificações",
  projetos: "Projetos",
  campanhas: "Campanhas",
  relatorios: "Relatórios",
  chamados: "Chamados",
  arquivos: "Arquivos",
  novo: "Novo",
};

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
      navItems={[
        { href: "/portal", label: "Início" },
        { href: "/portal/onboarding", label: "Onboarding" },
        ...(hasPermission(ctx, "projects.read") ? [{ href: "/portal/projetos", label: "Projetos" }] : []),
        ...(hasPermission(ctx, "campaigns.read") ? [{ href: "/portal/campanhas", label: "Campanhas" }] : []),
        ...(hasPermission(ctx, "reports.read") ? [{ href: "/portal/relatorios", label: "Relatórios" }] : []),
        ...(hasPermission(ctx, "tickets.read") ? [{ href: "/portal/chamados", label: "Chamados" }] : []),
        ...(hasPermission(ctx, "files.download") ? [{ href: "/portal/arquivos", label: "Arquivos" }] : []),
        ...(hasPermission(ctx, "users.read") ? [{ href: "/portal/equipe", label: "Equipe" }] : []),
        { href: "/portal/organizacao", label: "Organização" },
        { href: "/portal/perfil", label: "Perfil" },
      ]}
      orgSwitcher={<OrganizationSwitcher current={organization} memberships={ctx.memberships} />}
      notifications={<NotificationsMenu items={items} unreadCount={unreadCount} viewAllHref="/portal/notificacoes" />}
      userMenu={<UserMenu name={ctx.name} email={ctx.email} />}
      breadcrumbs={<Breadcrumbs root="/portal" rootLabel="Portal" labels={BREADCRUMB_LABELS} />}
    >
      {children}
    </AppShell>
  );
}
