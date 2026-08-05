import type { Metadata } from "next";

import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redefinido?: string; "convite-aceito"?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Entrar</h1>
        <p className="mt-1 text-sm text-text-secondary">Acesse o painel com seu e-mail e senha.</p>
      </div>

      {params.redefinido && (
        <p className="rounded-[var(--radius-md)] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Senha redefinida. Faça login com a nova senha.
        </p>
      )}
      {params["convite-aceito"] && (
        <p className="rounded-[var(--radius-md)] border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Convite aceito. Faça login para continuar.
        </p>
      )}

      <LoginForm />
    </div>
  );
}
