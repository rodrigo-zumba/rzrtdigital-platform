"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { updateInternalRoleSchema } from "@/modules/users/schemas/user.schemas";
import { updateInternalUserRole } from "@/modules/users/services/user.service";

export async function updateInternalRoleAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateInternalRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await updateInternalUserRole(ctx, parsed.data.userId, parsed.data.role);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, data: undefined };
}
