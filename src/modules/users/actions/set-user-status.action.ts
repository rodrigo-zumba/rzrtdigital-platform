"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { setUserStatusSchema } from "@/modules/users/schemas/user.schemas";
import { setInternalUserStatus } from "@/modules/users/services/user.service";

export async function setUserStatusAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setUserStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await setInternalUserStatus(ctx, parsed.data.userId, parsed.data.status);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, data: undefined };
}
