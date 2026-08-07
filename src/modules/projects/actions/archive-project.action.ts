"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { archiveProjectSchema } from "@/modules/projects/schemas/project.schemas";
import { archiveProject } from "@/modules/projects/services/project.service";

export async function archiveProjectAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = archiveProjectSchema.safeParse({
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await archiveProject(ctx, parsed.data.organizationId, parsed.data.projectId);
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect(`/admin/clientes/${parsed.data.organizationId}/projetos`);
}
