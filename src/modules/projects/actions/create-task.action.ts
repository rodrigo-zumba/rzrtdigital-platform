"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { createTaskSchema } from "@/modules/projects/schemas/project.schemas";
import { createTask } from "@/modules/projects/services/project.service";

export async function createTaskAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse({
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, projectId, ...input } = parsed.data;

  try {
    await createTask(ctx, organizationId, projectId, input);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${organizationId}/projetos/${projectId}`);
  revalidatePath(`/portal/projetos/${projectId}`);
  return { ok: true, data: undefined };
}
