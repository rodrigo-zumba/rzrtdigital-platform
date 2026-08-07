"use client";

import type { Task, TaskStatus } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { createTaskAction } from "@/modules/projects/actions/create-task.action";
import { deleteTaskAction } from "@/modules/projects/actions/delete-task.action";
import { updateTaskStatusAction } from "@/modules/projects/actions/update-task-status.action";

const STATUS_LABEL: Record<TaskStatus, string> = { TODO: "A fazer", IN_PROGRESS: "Em andamento", DONE: "Concluída" };

export function TasksSection({
  organizationId,
  projectId,
  tasks,
  canManage,
}: {
  organizationId: string;
  projectId: string;
  tasks: Task[];
  canManage: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">Tarefas</h2>

      {tasks.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhuma tarefa criada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border bg-surface/40 px-4 py-2.5"
            >
              <div>
                <p className={`text-sm font-medium ${task.status === "DONE" ? "text-text-secondary line-through" : "text-text-primary"}`}>
                  {task.title}
                </p>
              </div>
              {canManage ? (
                <TaskActions organizationId={organizationId} projectId={projectId} task={task} />
              ) : (
                <span className="text-xs text-text-secondary">{STATUS_LABEL[task.status]}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && <AddTaskForm organizationId={organizationId} projectId={projectId} />}
    </section>
  );
}

function TaskActions({
  organizationId,
  projectId,
  task,
}: {
  organizationId: string;
  projectId: string;
  task: Task;
}) {
  const [statusState, statusAction] = useActionState<ActionResult | null, FormData>(updateTaskStatusAction, null);
  const [deleteState, deleteFormAction] = useActionState<ActionResult | null, FormData>(deleteTaskAction, null);

  return (
    <div className="flex items-center gap-2">
      <form action={statusAction} className="flex items-center gap-1">
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="taskId" value={task.id} />
        <StatusSelect currentStatus={task.status} />
        {statusState && !statusState.ok && <span className="text-xs text-danger">{statusState.error.message}</span>}
      </form>
      <form action={deleteFormAction}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="taskId" value={task.id} />
        <DeleteButton />
        {deleteState && !deleteState.ok && <span className="text-xs text-danger">{deleteState.error.message}</span>}
      </form>
    </div>
  );
}

function StatusSelect({ currentStatus }: { currentStatus: TaskStatus }) {
  const { pending } = useFormStatus();

  return (
    <select
      name="status"
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="min-h-[36px] rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-2 py-1 text-xs text-text-primary outline-none focus-visible:border-blue-light disabled:opacity-60"
    >
      {Object.entries(STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-60"
    >
      Excluir
    </button>
  );
}

function AddTaskForm({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createTaskAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input
        name="title"
        placeholder="Nova tarefa"
        required
        className="min-h-[40px] min-w-[220px] rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
      />
      <select
        name="priority"
        defaultValue="MEDIUM"
        className="min-h-[40px] rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
      >
        <option value="LOW">Baixa</option>
        <option value="MEDIUM">Média</option>
        <option value="HIGH">Alta</option>
        <option value="URGENT">Urgente</option>
      </select>
      <AddButton />
      {state && !state.ok && <span className="text-xs text-danger">{state.error.message}</span>}
    </form>
  );
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[40px] rounded-[var(--radius-sm)] bg-blue px-4 text-sm font-semibold text-text-primary hover:brightness-110 disabled:opacity-60"
    >
      Adicionar
    </button>
  );
}
