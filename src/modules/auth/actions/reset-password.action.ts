"use server";

import { redirect } from "next/navigation";

import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { resetPassword } from "@/modules/auth/services/password-reset.service";

import { resetPasswordSchema } from "../schemas/auth.schemas";

export async function resetPasswordAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  try {
    await resetPassword({ token: parsed.data.token, password: parsed.data.password });
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect("/login?redefinido=1");
}
