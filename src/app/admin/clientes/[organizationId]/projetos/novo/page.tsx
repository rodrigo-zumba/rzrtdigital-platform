import type { Metadata } from "next";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { createProjectAction } from "@/modules/projects/actions/create-project.action";

export const metadata: Metadata = { title: "Novo projeto" };

export default async function NovoProjetoPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Novo projeto</h1>
      <ProjectForm hiddenFields={{ organizationId }} onSubmitAction={createProjectAction} submitLabel="Criar projeto" />
    </div>
  );
}
