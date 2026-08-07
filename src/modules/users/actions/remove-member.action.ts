"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { removeMemberSchema } from "@/modules/users/schemas/user.schemas";
import { removeMember } from "@/modules/users/services/user.service";

export async function removeMemberAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = removeMemberSchema.safeParse({
    organizationId: formData.get("organizationId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await removeMember(ctx, parsed.data.organizationId, parsed.data.userId);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}`);
  return { ok: true, data: undefined };
}
