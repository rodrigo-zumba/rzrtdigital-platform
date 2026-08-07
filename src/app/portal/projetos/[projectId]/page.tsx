import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { TasksSection } from "@/components/projects/TasksSection";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { NotFoundError } from "@/lib/errors";
import { getProject } from "@/modules/projects/services/project.service";

export const metadata: Metadata = { title: "Projeto" };

export default async function PortalProjetoDetalhePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  let project;
  try {
    project = await getProject(ctx, organizationId, projectId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="text-sm text-text-secondary">{project.description ?? "Sem descrição."}</p>
      <p className="text-sm text-text-secondary">Progresso: {project.progress}%</p>

      <TasksSection organizationId={organizationId} projectId={projectId} tasks={project.tasks} canManage={false} />
    </div>
  );
}
