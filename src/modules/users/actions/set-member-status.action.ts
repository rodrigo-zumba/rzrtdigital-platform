"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { setMemberStatusSchema } from "@/modules/users/schemas/user.schemas";
import { setMemberStatus } from "@/modules/users/services/user.service";

export async function setMemberStatusAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setMemberStatusSchema.safeParse({
    organizationId: formData.get("organizationId"),
    userId: formData.get("userId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await setMemberStatus(ctx, parsed.data.organizationId, parsed.data.userId, parsed.data.status);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}`);
  return { ok: true, data: undefined };
}
