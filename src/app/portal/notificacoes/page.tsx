import type { Metadata } from "next";

import { NotificationsList } from "@/components/layout/NotificationsList";
import { requireRequestContext } from "@/lib/auth";
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
  const result = await listNotifications(ctx, params);

  return <NotificationsList result={result} basePath="/portal/notificacoes" />;
}
