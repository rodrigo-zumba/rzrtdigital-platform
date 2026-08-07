"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { updateProjectSchema } from "@/modules/projects/schemas/project.schemas";
import { updateProject } from "@/modules/projects/services/project.service";

export async function updateProjectAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateProjectSchema.safeParse({
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    priority: formData.get("priority"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, projectId, ...input } = parsed.data;

  try {
    await updateProject(ctx, organizationId, projectId, input);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${organizationId}/projetos/${projectId}`);
  revalidatePath(`/portal/projetos/${projectId}`);
  return { ok: true, data: undefined };
}
