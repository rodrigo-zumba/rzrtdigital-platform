import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text-primary">Link inválido</h1>
        <p className="text-sm text-text-secondary">
          Este link de redefinição está incompleto. Solicite um novo link.
        </p>
        <Link href="/esqueci-minha-senha" className="text-sm text-blue-light">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Redefinir senha</h1>
        <p className="mt-1 text-sm text-text-secondary">Escolha uma nova senha para sua conta.</p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
