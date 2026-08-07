import type { Metadata } from "next";

import { OrganizationForm } from "@/components/forms/OrganizationForm";
import { createOrganizationAction } from "@/modules/organizations/actions/create-organization.action";

export const metadata: Metadata = { title: "Novo cliente" };

export default function NovoClientePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Novo cliente</h1>
        <p className="mt-1 text-sm text-text-secondary">Cadastre uma nova organização cliente.</p>
      </div>

      <OrganizationForm onSubmitAction={createOrganizationAction} submitLabel="Criar cliente" />
    </div>
  );
}
