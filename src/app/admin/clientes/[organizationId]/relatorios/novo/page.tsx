import type { Metadata } from "next";

import { ReportForm } from "@/components/reports/ReportForm";

export const metadata: Metadata = { title: "Novo relatório" };

export default async function NovoRelatorioPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Novo relatório</h1>
      <ReportForm organizationId={organizationId} />
    </div>
  );
}
