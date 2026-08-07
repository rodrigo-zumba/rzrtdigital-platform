import type { ProjectPriority, ProjectStatus, ProjectType, TaskStatus } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Este único lookup existe porque canAccessProject (docs/ESPECIFICACAO.md
 * §4) precisa resolver o organizationId de um projeto a partir só do id —
 * por isso é um `findUnique` (não exige organizationId no where, ver
 * src/lib/db/tenant-guard.ts) seguido de comparação explícita contra o
 * escopo do ctx, feita pelo helper que chama esta função. Nunca usar o
 * organizationId retornado aqui como filtro sem essa comparação.
 */
export function findOrganizationIdByProjectId(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true, deletedAt: true },
  });
}

export type ProjectWriteInput = {
  name: string;
  description?: string;
  type: ProjectType;
  priority: ProjectPriority;
  startDate?: Date;
  dueDate?: Date;
};

export function listProjects(organizationId: string, params: { skip: number; take: number }) {
  return db.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countProjects(organizationId: string) {
  return db.project.count({ where: { organizationId } });
}

export function createProject(organizationId: string, createdById: string, input: ProjectWriteInput) {
  return db.project.create({
    data: {
      organizationId,
      createdById,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      priority: input.priority,
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
    },
  });
}

/** `id` + `organizationId` no where — findUnique não aceita filtro composto por tenant guard. */
export function findProjectById(organizationId: string, projectId: string) {
  return db.project.findFirst({
    where: { id: projectId, organizationId },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  });
}

export function updateProject(organizationId: string, projectId: string, input: ProjectWriteInput) {
  return db.project.update({
    where: { id: projectId, organizationId },
    data: {
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      priority: input.priority,
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
    },
  });
}

export function updateProjectStatus(organizationId: string, projectId: string, status: ProjectStatus) {
  return db.project.update({ where: { id: projectId, organizationId }, data: { status } });
}

export function updateProjectProgress(organizationId: string, projectId: string, progress: number) {
  return db.project.update({ where: { id: projectId, organizationId }, data: { progress } });
}

export function softDeleteProject(organizationId: string, projectId: string) {
  return db.project.update({
    where: { id: projectId, organizationId },
    data: { deletedAt: new Date(), status: "CANCELLED" },
  });
}

// --- Tasks -------------------------------------------------------------
// Task não é tenant-scoped diretamente (deriva o tenant de Project — ver
// src/lib/db/tenant-scoped-models.ts). O caller (service) sempre resolve e
// valida o projectId contra a organização antes de chamar estas funções.

export type TaskWriteInput = {
  title: string;
  description?: string;
  priority: ProjectPriority;
  assignedToId?: string;
  dueDate?: Date;
};

export function createTask(projectId: string, input: TaskWriteInput) {
  return db.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      assignedToId: input.assignedToId ?? null,
      dueDate: input.dueDate ?? null,
    },
  });
}

export function findTaskById(taskId: string) {
  return db.task.findUnique({ where: { id: taskId }, select: { id: true, projectId: true } });
}

export function updateTaskStatus(taskId: string, status: TaskStatus) {
  return db.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
}

export function deleteTask(taskId: string) {
  return db.task.delete({ where: { id: taskId } });
}

export type ProjectStats = {
  byStatus: Record<ProjectStatus, number>;
  avgProgressInProgress: number | null;
};

/**
 * Card "projetos" do dashboard (Etapa 4). `organizationIds` undefined =
 * sem restrição de escopo (chave "organizationId" ainda precisa estar
 * presente no where para o tenant guard — ver src/lib/db/tenant-guard.ts).
 */
export async function getProjectStats(organizationIds?: string[]): Promise<ProjectStats> {
  const where = { organizationId: organizationIds ? { in: organizationIds } : undefined };

  const [groups, inProgressAvg] = await Promise.all([
    db.project.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.project.aggregate({ where: { ...where, status: "IN_PROGRESS" }, _avg: { progress: true } }),
  ]);

  const byStatus: Record<ProjectStatus, number> = {
    PLANNING: 0,
    IN_PROGRESS: 0,
    ON_HOLD: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const group of groups) byStatus[group.status] = group._count._all;

  return { byStatus, avgProgressInProgress: inProgressAvg._avg.progress };
}
