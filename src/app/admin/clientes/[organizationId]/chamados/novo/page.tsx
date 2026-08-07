import type { Metadata } from "next";

import { TicketForm } from "@/components/tickets/TicketForm";

export const metadata: Metadata = { title: "Novo chamado" };

export default async function NovoChamadoPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Novo chamado</h1>
      <TicketForm organizationId={organizationId} />
    </div>
  );
}
