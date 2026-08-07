"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { updateOwnProfileSchema } from "@/modules/users/schemas/user.schemas";
import { updateOwnProfile } from "@/modules/users/services/user.service";

export async function updateOwnProfileAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateOwnProfileSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await updateOwnProfile(ctx, parsed.data.name);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
  return { ok: true, data: undefined };
}
