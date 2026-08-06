import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const passwordRules = z
  .string()
    .min(8, "A senha precisa ter no mínimo 8 caracteres.")
    .regex(/[A-Z]/, "A senha precisa ter ao menos uma letra maiúscula.")
  .regex(/[a-z]/, "A senha precisa ter ao menos uma letra minúscula.")
  .regex(/[0-9]/, "A senha precisa ter ao menos um número.");

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().trim().min(1, "Informe seu nome.").optional(),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
