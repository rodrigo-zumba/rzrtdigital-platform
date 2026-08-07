import type { RequestContext } from "@/lib/auth/types";
import { requirePermission } from "@/lib/permissions";
import {
  countUnreadForUser,
  listUnreadForUser,
  markAllAsRead,
  markAsRead,
} from "@/modules/notifications/repositories/notification.repository";

const BELL_PREVIEW_SIZE = 5;

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
