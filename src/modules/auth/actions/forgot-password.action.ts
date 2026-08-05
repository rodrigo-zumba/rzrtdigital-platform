"use server";

import { headers } from "next/headers";

import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { getClientIp } from "@/lib/security/rate-limit";
import { requestPasswordReset } from "@/modules/auth/services/password-reset.service";

import { forgotPasswordSchema } from "../schemas/auth.schemas";

const GENERIC_SUCCESS_MESSAGE = "Se o e-mail existir, enviaremos as instruções de redefinição.";

export async function forgotPasswordAction(
  _prevState: ActionResult<{ message: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ message: string }>> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Informe um e-mail válido."));
  }

  const ip = getClientIp(await headers());
  await requestPasswordReset({ email: parsed.data.email, ip });

  // Mesma mensagem sempre — sem enumeração de usuário (CLAUDE.md §4.7).
  return { ok: true, data: { message: GENERIC_SUCCESS_MESSAGE } };
}
