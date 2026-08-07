"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { readAllNotifications, readNotification } from "@/modules/notifications/services/notification.service";

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const notificationId = formData.get("notificationId");
  const ctx = await requireRequestContext();

  if (typeof notificationId === "string" && notificationId.length > 0) {
    await readNotification(ctx, notificationId);
  } else {
    await readAllNotifications(ctx);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}
