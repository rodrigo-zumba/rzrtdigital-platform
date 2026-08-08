import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationsList } from "@/components/layout/NotificationsList";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { listNotificationsSchema } from "@/modules/notifications/schemas/notification.schemas";
import { listNotifications } from "@/modules/notifications/services/notification.service";

export const metadata: Metadata = { title: "Notificações" };

export default async function PortalNotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const rawParams = await searchParams;
  const parsed = listNotificationsSchema.safeParse(rawParams);
  const params = parsed.success ? parsed.data : { page: 1 };

  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const result = await listNotifications(ctx, params, organizationId);

  return <NotificationsList result={result} basePath="/portal/notificacoes" />;
}
