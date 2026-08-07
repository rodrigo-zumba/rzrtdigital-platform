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

export async function getNotificationsPreview(ctx: RequestContext) {
  requirePermission(ctx, "notifications.read");

  const [items, unreadCount] = await Promise.all([
    listUnreadForUser(ctx.userId, BELL_PREVIEW_SIZE),
    countUnreadForUser(ctx.userId),
  ]);

  return { items, unreadCount };
}

export async function readNotification(ctx: RequestContext, notificationId: string) {
  requirePermission(ctx, "notifications.read");
  await markAsRead(notificationId, ctx.userId);
}

export async function readAllNotifications(ctx: RequestContext) {
  requirePermission(ctx, "notifications.read");
  await markAllAsRead(ctx.userId);
}

export async function listNotifications(ctx: RequestContext, params: { page: number }) {
  requirePermission(ctx, "notifications.read");

  const [items, total] = await Promise.all([
    listForUser(ctx.userId, { skip: (params.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countForUser(ctx.userId),
  ]);

  return { items, total, page: params.page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
