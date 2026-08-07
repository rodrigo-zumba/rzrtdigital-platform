import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectProgressForm } from "@/components/projects/ProjectProgressForm";
import { ProjectStatusActions } from "@/components/projects/ProjectStatusActions";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { TasksSection } from "@/components/projects/TasksSection";
import { requireRequestContext } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { updateProjectAction } from "@/modules/projects/actions/update-project.action";
import { getProject } from "@/modules/projects/services/project.service";

export const metadata: Metadata = { title: "Projeto" };

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export default async function AdminProjetoDetalhePage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  const ctx = await requireRequestContext();

  let project;
  try {
    project = await getProject(ctx, organizationId, projectId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const canUpdate = hasPermission(ctx, "projects.update");
  const canManageTasks = hasPermission(ctx, "tasks.manage");

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
        <ProjectStatusBadge status={project.status} />
      </div>

      {canUpdate && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-text-secondary">Status</h2>
          <ProjectStatusActions organizationId={organizationId} projectId={projectId} status={project.status} />
          <ProjectProgressForm organizationId={organizationId} projectId={projectId} progress={project.progress} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-text-secondary">Dados do projeto</h2>
        {canUpdate ? (
          <ProjectForm
            defaultValues={{
              name: project.name,
              description: project.description ?? undefined,
              type: project.type,
              priority: project.priority,
              startDate: toDateInputValue(project.startDate),
              dueDate: toDateInputValue(project.dueDate),
            }}
            hiddenFields={{ organizationId, projectId }}
            onSubmitAction={updateProjectAction}
            submitLabel="Salvar alterações"
          />
        ) : (
          <p className="text-sm text-text-secondary">{project.description ?? "Sem descrição."}</p>
        )}
      </section>

      <TasksSection organizationId={organizationId} projectId={projectId} tasks={project.tasks} canManage={canManageTasks} />
    </div>
  );
}
