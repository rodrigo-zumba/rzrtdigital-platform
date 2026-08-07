import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrganizationStatusBadge } from "@/components/admin/OrganizationStatusBadge";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { getOrganizationForMember } from "@/modules/organizations/services/organization.service";

export const metadata: Metadata = { title: "Organização" };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

export default async function OrganizacaoPage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const organization = await getOrganizationForMember(ctx, organizationId);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">{organization.name}</h1>
        <OrganizationStatusBadge status={organization.status} />
      </div>

      <div className="surface-card grid grid-cols-2 gap-4 p-5">
        <Field label="Identificador" value={`/${organization.slug}`} />
        <Field label="Razão social" value={organization.legalName ?? "—"} />
        <Field label="CNPJ" value={organization.document ?? "—"} />
        <Field label="Site" value={organization.website ?? "—"} />
        <Field label="Telefone" value={organization.phone ?? "—"} />
        <Field label="Segmento" value={organization.segment ?? "—"} />
      </div>

      <p className="text-sm text-text-secondary">
        Para atualizar esses dados, entre em contato com o seu gerente de conta.
      </p>
    </div>
  );
}
