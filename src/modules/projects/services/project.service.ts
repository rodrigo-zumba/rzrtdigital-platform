import type { ProjectStatus, TaskStatus } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertOrganizationAccess, requirePermission } from "@/lib/permissions";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  countProjects,
  createProject as createProjectRow,
  createTask as createTaskRow,
  deleteTask as deleteTaskRow,
  findProjectById,
  findTaskById,
  listProjects as listProjectsRows,
  softDeleteProject,
  updateProject as updateProjectRow,
  updateProjectProgress,
  updateProjectStatus,
  updateTaskStatus as updateTaskStatusRow,
  type ProjectWriteInput,
  type TaskWriteInput,
} from "@/modules/projects/repositories/project.repository";

const PAGE_SIZE = 20;

export async function listProjects(ctx: RequestContext, organizationId: string, page: number) {
  requirePermission(ctx, "projects.read");
  assertOrganizationAccess(ctx, organizationId);

  const [items, total] = await Promise.all([
    listProjectsRows(organizationId, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countProjects(organizationId),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getProject(ctx: RequestContext, organizationId: string, projectId: string) {
  requirePermission(ctx, "projects.read");
  assertOrganizationAccess(ctx, organizationId);

  const project = await findProjectById(organizationId, projectId);
  if (!project || project.deletedAt) throw new NotFoundError("Projeto não encontrado.");

  return project;
}

export async function createProject(ctx: RequestContext, organizationId: string, input: ProjectWriteInput) {
  requirePermission(ctx, "projects.create");
  assertOrganizationAccess(ctx, organizationId);

  const project = await createProjectRow(organizationId, ctx.userId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "project.create",
    entityType: "Project",
    entityId: project.id,
    metadata: { name: project.name },
  });

  return project;
}

async function assertProjectInOrganization(organizationId: string, projectId: string) {
  const project = await findProjectById(organizationId, projectId);
  if (!project || project.deletedAt) throw new NotFoundError("Projeto não encontrado.");
  return project;
}

export async function updateProject(
  ctx: RequestContext,
  organizationId: string,
  projectId: string,
  input: ProjectWriteInput,
) {
  requirePermission(ctx, "projects.update");
  assertOrganizationAccess(ctx, organizationId);
  await assertProjectInOrganization(organizationId, projectId);

  const project = await updateProjectRow(organizationId, projectId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "project.update",
    entityType: "Project",
    entityId: projectId,
    metadata: { name: input.name },
  });

  return project;
}

export async function setProjectStatus(
  ctx: RequestContext,
  organizationId: string,
  projectId: string,
  status: ProjectStatus,
) {
  requirePermission(ctx, "projects.update");
  assertOrganizationAccess(ctx, organizationId);
  const current = await assertProjectInOrganization(organizationId, projectId);
  if (current.status === status) return current;

  const project = await updateProjectStatus(organizationId, projectId, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "project.status_change",
    entityType: "Project",
    entityId: projectId,
    metadata: { from: current.status, to: status },
  });

  return project;
}

export async function setProjectProgress(
  ctx: RequestContext,
  organizationId: string,
  projectId: string,
  progress: number,
) {
  requirePermission(ctx, "projects.update");
  assertOrganizationAccess(ctx, organizationId);
  await assertProjectInOrganization(organizationId, projectId);

  return updateProjectProgress(organizationId, projectId, progress);
}

export async function archiveProject(ctx: RequestContext, organizationId: string, projectId: string) {
  requirePermission(ctx, "projects.archive");
  assertOrganizationAccess(ctx, organizationId);
  await assertProjectInOrganization(organizationId, projectId);

  await softDeleteProject(organizationId, projectId);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "project.archive",
    entityType: "Project",
    entityId: projectId,
    metadata: {},
  });
}

export async function createTask(
  ctx: RequestContext,
  organizationId: string,
  projectId: string,
  input: TaskWriteInput,
) {
  requirePermission(ctx, "tasks.manage");
  assertOrganizationAccess(ctx, organizationId);
  await assertProjectInOrganization(organizationId, projectId);

  const task = await createTaskRow(projectId, input);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "task.create",
    entityType: "Task",
    entityId: task.id,
    metadata: { title: task.title, projectId },
  });

  return task;
}

/**
 * IDOR guard: `taskId` nunca é usado como filtro sem antes confirmar que a
 * tarefa pertence ao `projectId` recebido e que o projeto pertence à
 * `organizationId` do ctx (Task deriva o tenant de Project, não é
 * tenant-scoped diretamente — ver tenant-scoped-models.ts).
 */
async function assertTaskInProject(projectId: string, taskId: string) {
  const task = await findTaskById(taskId);
  if (!task || task.projectId !== projectId) throw new ForbiddenError();
  return task;
}

export async function updateTaskStatus(
  ctx: RequestContext,
  organizationId: string,
  projectId: string,
  taskId: string,
  status: TaskStatus,
) {
  requirePermission(ctx, "tasks.manage");
  assertOrganizationAccess(ctx, organizationId);
  await assertProjectInOrganization(organizationId, projectId);
  await assertTaskInProject(projectId, taskId);

  const task = await updateTaskStatusRow(taskId, status);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "task.status_change",
    entityType: "Task",
    entityId: taskId,
    metadata: { to: status },
  });

  return task;
}

export async function deleteTask(ctx: RequestContext, organizationId: string, projectId: string, taskId: string) {
  requirePermission(ctx, "tasks.manage");
  assertOrganizationAccess(ctx, organizationId);
  await assertProjectInOrganization(organizationId, projectId);
  await assertTaskInProject(projectId, taskId);

  await deleteTaskRow(taskId);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "task.delete",
    entityType: "Task",
    entityId: taskId,
    metadata: {},
  });
}
