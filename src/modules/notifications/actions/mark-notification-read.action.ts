"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/errors";
import { readAllNotifications, readNotification } from "@/modules/notifications/services/notification.service";

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const notificationId = formData.get("notificationId");
  const ctx = await requireRequestContext();

  let organizationId: string | undefined;
  if (ctx.kind === "CLIENT") {
    const selected = await getSelectedOrganizationId(ctx);
    if (!selected) throw new ForbiddenError();
    organizationId = selected;
  }

  if (typeof notificationId === "string" && notificationId.length > 0) {
    await readNotification(ctx, notificationId, organizationId);
  } else {
    await readAllNotifications(ctx, organizationId);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
}
