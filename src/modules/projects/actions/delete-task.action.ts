"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { deleteTaskSchema } from "@/modules/projects/schemas/project.schemas";
import { deleteTask } from "@/modules/projects/services/project.service";

export async function deleteTaskAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = deleteTaskSchema.safeParse({
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await deleteTask(ctx, parsed.data.organizationId, parsed.data.projectId, parsed.data.taskId);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}/projetos/${parsed.data.projectId}`);
  revalidatePath(`/portal/projetos/${parsed.data.projectId}`);
  return { ok: true, data: undefined };
}
