"use server";

import { redirect } from "next/navigation";

import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { acceptInvitation } from "@/modules/invitations/services/invitation.service";

import { acceptInvitationSchema } from "../schemas/auth.schemas";

export async function acceptInvitationAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = acceptInvitationSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  try {
    await acceptInvitation(parsed.data);
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect("/login?convite-aceito=1");
}
