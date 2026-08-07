"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { updateMemberRoleSchema } from "@/modules/users/schemas/user.schemas";
import { updateMemberRole } from "@/modules/users/services/user.service";

export async function updateMemberRoleAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateMemberRoleSchema.safeParse({
    organizationId: formData.get("organizationId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await updateMemberRole(ctx, parsed.data.organizationId, parsed.data.userId, parsed.data.role);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}`);
  return { ok: true, data: undefined };
}
