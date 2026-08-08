import type { RequestContext } from "@/lib/auth/types";
import { requirePermission } from "@/lib/permissions";
import {
  countForUser,
  countUnreadForUser,
  listForUser,
  listUnreadForUser,
  markAllAsRead,
  markAsRead,
} from "@/modules/notifications/repositories/notification.repository";

const BELL_PREVIEW_SIZE = 5;
const PAGE_SIZE = 20;

/**
 * Notificações são por usuário, não por organização (repositório filtra só
 * por `ctx.userId`) — mas para CLIENT o gate de permissão ainda exige a
 * organização atualmente selecionada (`organizationId`), pela mesma regra
 * de todo o resto do sistema: sem organização informada, `hasPermission`
 * nega (docs/lib/permissions/helpers.ts). Callers CLIENT sempre resolvem o
 * workspace selecionado antes de chamar; callers INTERNAL não precisam.
 */
export async function getNotificationsPreview(ctx: RequestContext, organizationId?: string) {
  requirePermission(ctx, "notifications.read", organizationId);

  const [items, unreadCount] = await Promise.all([
    listUnreadForUser(ctx.userId, BELL_PREVIEW_SIZE),
    countUnreadForUser(ctx.userId),
  ]);

  return { items, unreadCount };
}

export async function readNotification(ctx: RequestContext, notificationId: string, organizationId?: string) {
  requirePermission(ctx, "notifications.read", organizationId);
  await markAsRead(notificationId, ctx.userId);
}

export async function readAllNotifications(ctx: RequestContext, organizationId?: string) {
  requirePermission(ctx, "notifications.read", organizationId);
  await markAllAsRead(ctx.userId);
}

export async function listNotifications(ctx: RequestContext, params: { page: number }, organizationId?: string) {
  requirePermission(ctx, "notifications.read", organizationId);

  const [items, total] = await Promise.all([
    listForUser(ctx.userId, { skip: (params.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countForUser(ctx.userId),
  ]);

  return { items, total, page: params.page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
