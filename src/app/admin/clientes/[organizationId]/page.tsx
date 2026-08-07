import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteOrganizationButton } from "@/components/admin/DeleteOrganizationButton";
import { OrganizationStatusActions } from "@/components/admin/OrganizationStatusActions";
import { OrganizationStatusBadge } from "@/components/admin/OrganizationStatusBadge";
import { OrganizationForm } from "@/components/forms/OrganizationForm";
import { requireRequestContext } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError } from "@/lib/errors";
import { updateOrganizationAction } from "@/modules/organizations/actions/update-organization.action";
import { getOrganization } from "@/modules/organizations/services/organization.service";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const ctx = await requireRequestContext();

  let organization;
  try {
    organization = await getOrganization(ctx, organizationId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const canDelete = ctx.kind === "INTERNAL" && ctx.internalRole === "SUPER_ADMIN" && hasPermission(ctx, "organizations.delete");
  const canArchive = hasPermission(ctx, "organizations.archive");

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{organization.name}</h1>
          <p className="mt-1 text-sm text-text-secondary">/{organization.slug}</p>
        </div>
        <OrganizationStatusBadge status={organization.status} />
      </div>

      {canArchive && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-text-secondary">Status</h2>
          <OrganizationStatusActions organizationId={organization.id} status={organization.status} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-text-secondary">Dados cadastrais</h2>
        <OrganizationForm
          defaultValues={{
            name: organization.name,
            slug: organization.slug,
            legalName: organization.legalName ?? undefined,
            document: organization.document ?? undefined,
            website: organization.website ?? undefined,
            phone: organization.phone ?? undefined,
            segment: organization.segment ?? undefined,
          }}
          hiddenFields={{ organizationId: organization.id }}
          onSubmitAction={updateOrganizationAction}
          submitLabel="Salvar alterações"
        />
      </section>

      {canDelete && (
        <section className="flex flex-col gap-2 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-danger">Zona de risco</h2>
          <DeleteOrganizationButton organizationId={organization.id} organizationName={organization.name} />
        </section>
      )}
    </div>
  );
}
