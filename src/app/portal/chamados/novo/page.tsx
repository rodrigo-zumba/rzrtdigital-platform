import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TicketForm } from "@/components/tickets/TicketForm";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";

export const metadata: Metadata = { title: "Novo chamado" };

export default async function NovoChamadoPortalPage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Novo chamado</h1>
      <TicketForm organizationId={organizationId} />
    </div>
  );
}
