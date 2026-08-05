import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";

// Dashboard do cliente com dados reais é Fase 1/Etapa 4 — não implementado
// nesta sessão. Nenhum número hardcoded: só dados do próprio ctx.
export default async function PortalHomePage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const membership = ctx.memberships.find((m) => m.organizationId === organizationId);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold text-text-primary">Bem-vindo, {ctx.name}</h1>
      <p className="text-sm text-text-secondary">
        Organização: <strong>{membership?.organizationName}</strong>
      </p>
      <p className="text-sm text-text-secondary">
        Seu papel: <strong>{membership?.role}</strong>
      </p>
    </div>
  );
}
