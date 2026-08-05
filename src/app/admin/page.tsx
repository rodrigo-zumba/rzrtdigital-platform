import { requireRequestContext } from "@/lib/auth";

// Dashboard admin com dados reais (queries agregadas) é Fase 1/Etapa 4 —
// não implementado nesta sessão (backend + login). Nenhum número
// hardcoded: só dados reais do próprio ctx (CLAUDE.md §2, regra 2).
export default async function AdminHomePage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "INTERNAL") return null;

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold text-text-primary">Bem-vindo, {ctx.name}</h1>
      <p className="text-sm text-text-secondary">
        Perfil interno: <strong>{ctx.internalRole}</strong>
      </p>
      <p className="text-sm text-text-secondary">
        Organizações atribuídas: {ctx.assignments.length}
      </p>
    </div>
  );
}
