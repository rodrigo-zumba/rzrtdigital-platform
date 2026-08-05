"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth/config";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";

import { loginSchema } from "../schemas/auth.schemas";

export async function loginAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Informe e-mail e senha."));
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Genérico — sem enumeração de usuário (CLAUDE.md §4.7).
      return toErrorResponse(new ValidationError("Credenciais inválidas."));
    }
    throw error;
  }

  redirect("/");
}
