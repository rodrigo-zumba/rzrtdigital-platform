import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Esqueci minha senha</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Informe seu e-mail. Se ele existir, enviaremos as instruções de redefinição.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
