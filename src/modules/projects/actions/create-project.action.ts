"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { createProjectSchema } from "@/modules/projects/schemas/project.schemas";
import { createProject } from "@/modules/projects/services/project.service";

export async function createProjectAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createProjectSchema.safeParse({
    organizationId: formData.get("organizationId"),
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
  const { organizationId, ...input } = parsed.data;

  let projectId: string;
  try {
    const project = await createProject(ctx, organizationId, input);
    projectId = project.id;
  } catch (error) {
    return toErrorResponse(error);
  }

  const basePath = ctx.kind === "INTERNAL" ? `/admin/clientes/${organizationId}` : "/portal";
  redirect(`${basePath}/projetos/${projectId}`);
}
