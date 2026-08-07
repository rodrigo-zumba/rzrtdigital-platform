"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { inviteInternalUserSchema } from "@/modules/invitations/schemas/invitation.schemas";
import { inviteInternalUser } from "@/modules/invitations/services/invitation.service";

export async function inviteInternalUserAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = inviteInternalUserSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await inviteInternalUser(ctx, parsed.data);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath("/admin/usuarios");
  return { ok: true, data: undefined };
}
